// Turns the show's artwork into phosphor dithers for the site.
//
// Each image is shrunk to a low "signal" resolution, read as light (linear
// luminance), and dithered to a few levels. Lit pixels are written in the
// tube's phosphor colour; dark pixels are transparent, so the page's CSS glow
// and colour fringes (drop-shadow) follow the dots, not the image's box. The
// browser scales the result up with `image-rendering: pixelated`.
//
// `node scripts/dither.mjs` writes public/media/. Edit STYLE to change the
// look everywhere; the lab page (/dither/) shows every style side by side.

import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

/** The style the site uses. One of the keys of STYLES. */
export const STYLE = "atkinson";

/** Phosphor white, as in the intro's shader (1.0, 0.975, 0.94). */
const PHOSPHOR = [255, 249, 240];

const BAYER8 = (() => {
  // The 8×8 ordered-dither threshold map, built from the 2×2 one.
  let m = [[0, 2], [3, 1]];
  while (m.length < 8) {
    const n = m.length;
    const next = Array.from({ length: n * 2 }, () => new Array(n * 2));
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        const v = m[y][x] * 4;
        next[y][x] = v;
        next[y][x + n] = v + 2;
        next[y + n][x] = v + 3;
        next[y + n][x + n] = v + 1;
      }
    m = next;
  }
  return m.map((row) => row.map((v) => (v + 0.5) / 64));
})();

/** Error diffusion kernels: [dx, dy, weight]. Atkinson spreads only 6/8 of the error, so it keeps contrast. */
const KERNELS = {
  atkinson: [[1, 0, 1 / 8], [2, 0, 1 / 8], [-1, 1, 1 / 8], [0, 1, 1 / 8], [1, 1, 1 / 8], [0, 2, 1 / 8]],
  floyd: [[1, 0, 7 / 16], [-1, 1, 3 / 16], [0, 1, 5 / 16], [1, 1, 1 / 16]],
};

function diffuse(lum, w, h, kernel, levels) {
  const out = new Float32Array(lum);
  const steps = levels - 1;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const q = Math.round(Math.min(1, Math.max(0, out[i])) * steps) / steps;
      const err = out[i] - q;
      out[i] = q;
      for (const [dx, dy, k] of kernel) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < w && ny < h) out[ny * w + nx] += err * k;
      }
    }
  return out;
}

function ordered(lum, w, h, levels) {
  const out = new Float32Array(lum.length);
  const steps = levels - 1;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const v = lum[y * w + x] * steps;
      const base = Math.floor(v);
      out[y * w + x] = Math.min(steps, base + (v - base > BAYER8[y % 8][x % 8] ? 1 : 0)) / steps;
    }
  return out;
}

/**
 * The styles. `scale` is how many screen pixels one dither pixel covers on a
 * 1× display at full width; `gamma` and `contrast` shape the light before it is dithered.
 */
export const STYLES = {
  atkinson: { label: "Atkinson, 1-bit", run: (l, w, h) => diffuse(l, w, h, KERNELS.atkinson, 2), gamma: 0.85, contrast: 1.25 },
  floyd: { label: "Floyd–Steinberg, 1-bit", run: (l, w, h) => diffuse(l, w, h, KERNELS.floyd, 2), gamma: 0.9, contrast: 1.15 },
  bayer: { label: "Bayer 8×8, 1-bit", run: (l, w, h) => ordered(l, w, h, 2), gamma: 0.8, contrast: 1.3 },
  bayer4: { label: "Bayer 8×8, 4 levels", run: (l, w, h) => ordered(l, w, h, 4), gamma: 0.9, contrast: 1.15 },
};

/** sRGB (0..255) to linear light (0..1). */
const linear = (c) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

async function dither(src, { width, crop, style = STYLE, tone, out }) {
  const { run, gamma, contrast } = { ...STYLES[style], ...tone };
  let img = sharp(src);
  if (crop) img = img.extract(crop);
  const { data, info } = await img
    .resize({ width, kernel: "lanczos3" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const lum = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const y = 0.2126 * linear(data[i * 3]) + 0.7152 * linear(data[i * 3 + 1]) + 0.0722 * linear(data[i * 3 + 2]);
    // Perceptual lift (photos are mostly dark against black glass), then contrast around the middle.
    const p = y ** (gamma / 2.2);
    lum[i] = Math.min(1, Math.max(0, (p - 0.5) * contrast + 0.5));
  }
  const levels = run(lum, w, h);
  const rgba = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    rgba[i * 4] = PHOSPHOR[0];
    rgba[i * 4 + 1] = PHOSPHOR[1];
    rgba[i * 4 + 2] = PHOSPHOR[2];
    rgba[i * 4 + 3] = Math.round(levels[i] * 255);
  }
  await sharp(rgba, { raw: { width: w, height: h, channels: 4 } })
    .png({ palette: true, colours: 4, compressionLevel: 9 })
    .toFile(out);
  return { w, h };
}

// --- What the site needs --------------------------------------------------

const EPISODES = [{ id: "01", src: "media/episodes/01.png" }];

/** Faces are lit against black: darker and harder than the full artwork, so they keep their features. */
const PORTRAIT = { gamma: 1.15, contrast: 1.4 };

/** Host portraits, cut from episode 1's artwork (1672×941): Valtteri left, Joni centre, Mikko right. */
const HOSTS = [
  { id: "valtteri", crop: { left: 300, top: 434, width: 370, height: 370 } },
  { id: "joni", crop: { left: 655, top: 434, width: 370, height: 370 } },
  { id: "mikko", crop: { left: 1040, top: 434, width: 370, height: 370 } },
];

const LAB_WIDTHS = [400, 560, 840];
/** Full-size artwork for podcast apps: the 560 px dither, 3× with hard pixels, on the tube's glass. */
const ARTWORK_SCALE = 3;
const GLASS = "#0b0c0b";

const dir = (p) => mkdir(p, { recursive: true });
await Promise.all(["public/media/episodes", "public/media/hosts", "public/media/lab", "public/media/og", "src/data"].map(dir));

for (const e of EPISODES) {
  await dither(e.src, { width: 560, out: `public/media/episodes/${e.id}.png` });
  // The colour original, for link previews and podcast apps.
  await sharp(e.src).resize({ width: 1200 }).jpeg({ quality: 82, mozjpeg: true }).toFile(`public/media/og/${e.id}.jpg`);
  for (const style of Object.keys(STYLES)) {
    for (const width of LAB_WIDTHS) {
      const out = `public/media/lab/${e.id}-${style}-${width}.png`;
      const { w, h } = await dither(e.src, { width, style, out });
      if (width !== 560) continue;
      await sharp(out)
        .resize({ width: w * ARTWORK_SCALE, height: h * ARTWORK_SCALE, kernel: "nearest" })
        .flatten({ background: GLASS })
        .png({ compressionLevel: 9 })
        .toFile(`public/media/lab/${e.id}-${style}-artwork.png`);
    }
  }
}
for (const host of HOSTS) {
  await dither(EPISODES[0].src, { width: 240, crop: host.crop, tone: PORTRAIT, out: `public/media/hosts/${host.id}.png` });
}

// What the lab page lists.
const manifest = {
  style: STYLE,
  widths: LAB_WIDTHS,
  episodes: EPISODES.map((e) => e.id),
  styles: Object.entries(STYLES).map(([key, s]) => ({ key, label: s.label })),
};
await writeFile("src/data/dither.json", `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`dither: ${STYLE}, ${EPISODES.length} episode(s), ${HOSTS.length} hosts, lab of ${Object.keys(STYLES).length} styles`);
