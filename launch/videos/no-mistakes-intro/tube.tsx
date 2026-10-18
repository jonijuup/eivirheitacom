import "@fontsource/ibm-plex-mono/400.css";
import {
  audioLevels,
  ease,
  interpolate,
  type Levels,
  springTo,
  useFrame,
  useVideoInfo,
  waitFor,
} from "@intentface-launch/core";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { type Cues, caretOn, type Key, type Line, lineAt } from "./timing.ts";

// The no-mistakes CRT (videos/no-mistakes/crt.tsx), with a voice in it. The
// caret melts into an orb that moves with the narration, the names are typed
// under it, the orb shrinks back into the caret, "Ei virheitä" is typed, and
// the logo glitches while the episode's mistakes are whispered.
//
// Text and the orb are drawn into small 2D canvases (the signal) and a blurred
// copy (the glow); one WebGL pass does what the tube does. The orb has its own
// signal so its red and blue can drift apart without touching the text.

/** Logo text size on screen, in 1080p pixels (as in no-mistakes). */
const SIZE = 128;
const FONT = `400 ${SIZE}px "IBM Plex Mono"`;
/** The names, under the orb. */
const NAME_SIZE = 52;
const NAME_FONT = `400 ${NAME_SIZE}px "IBM Plex Mono"`;
/** Where the line under the orb sits when it rises under the logo: this far below the logo's baseline. */
const UNDER_LOGO = 104;
/** The orb's radius at rest. */
const RADIUS = 150;
/** The caret melts into the orb over this long. */
const MELT = 0.5;
/** Signal at half the frame's resolution, so edges are as soft as a beam; glow at a quarter. */
const SIGNAL = 2;
const GLOW = 4;
/** Afterglow: what has just gone out fades over a few frames. */
const PERSIST = [1, 0.45, 0.18, 0.06];

// --- The tube ---------------------------------------------------------------

const VERTEX = `#version 300 es
in vec2 p;
out vec2 uv;
void main() { uv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAGMENT = `#version 300 es
precision highp float;
in vec2 uv;
out vec4 color;
uniform sampler2D signal;
uniform sampler2D glow;
uniform sampler2D orb;
uniform vec2 res;        // output size in device pixels
uniform float px;        // device pixels per 1080p pixel
uniform float frame;
uniform float bloom;
uniform float zoom;
uniform float mask;      // 0 smooth, 1 full phosphor dots
uniform vec2 orbShift;   // red one way, blue the other, in uv
uniform float orbGain;
uniform float split;     // the glitch: the text's red and blue apart, in 1080p pixels
uniform float tear;      // the glitch: bands of the picture shifted sideways
uniform float seed;

const float DOT = 4.0;
const vec3 PHOSPHOR = vec3(1.0, 0.975, 0.94);
const vec3 HALO = vec3(1.0, 0.92, 0.82);
const vec3 GLASS = vec3(0.066, 0.07, 0.068);

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

vec2 curve(vec2 q) {
  vec2 c = (q * 2.0 - 1.0) / zoom;
  c *= 1.0 + vec2(0.028, 0.045) * (c.yx * c.yx);
  return c * 0.5 + 0.5;
}

float screen(vec2 q) {
  vec2 aspect = vec2(res.x / res.y, 1.0);
  const float R = 0.07;
  vec2 d = abs((q - 0.5) * aspect) - (0.5 * aspect - R);
  float dist = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - R;
  return 1.0 - smoothstep(-0.003, 0.003, dist);
}

void main() {
  float pitch = DOT * px;
  vec2 cell = floor(gl_FragCoord.xy / pitch);
  vec2 within = (gl_FragCoord.xy - (cell + 0.5) * pitch) / pitch;
  vec2 q = curve(uv);
  vec2 c = q - 0.5;

  // A torn signal: a few bands of lines jump sideways, each by its own amount.
  vec2 s = q;
  if (tear > 0.0) {
    float band = floor(q.y * mix(9.0, 31.0, hash(vec2(seed, 1.0))));
    float pick = hash(vec2(band, seed));
    s.x += step(1.0 - 0.45 * tear, pick) * (hash(vec2(band, seed + 7.0)) - 0.5) * 0.05 * tear;
  }

  vec2 fringe = vec2((1.4 + split) / 1920.0, 0.0) + c * vec2(0.0016, 0.0008);
  float r = (texture(signal, s + fringe).r + texture(signal, s + 0.5 * fringe).r) * 0.5;
  float g = texture(signal, s).r;
  float b = (texture(signal, s - fringe).r + texture(signal, s - 0.5 * fringe).r) * 0.5;
  vec3 orbc = vec3(texture(orb, s + orbShift + fringe).r, texture(orb, s).r, texture(orb, s - orbShift - fringe).r);
  float smear = 0.0;
  for (float i = 1.0; i <= 4.0; i++) {
    vec2 o = s - vec2(i * 2.0 / 1920.0, 0.0);
    smear += (texture(signal, o).g + texture(orb, o).r * orbGain) * exp(-i * 0.7);
  }
  vec3 beam = (vec3(r, g, b) + orbc * orbGain + smear * 0.18) * PHOSPHOR;

  float centre = pow(clamp(16.0 * q.x * q.y * (1.0 - q.x) * (1.0 - q.y), 0.0, 1.0), 0.25);
  vec3 glass = GLASS * mix(0.6, 1.1, centre);

  float roll = exp(-pow((fract(q.y + frame / 60.0 * 0.11) - 0.5) * 7.0, 2.0));
  float flicker = 1.0 + (hash(vec2(floor(frame), 7.0)) - 0.5) * 0.02;
  float light = (1.0 + roll * 0.05) * flicker;
  beam *= light;

  float lum = dot(beam, vec3(0.3, 0.59, 0.11));
  float spread = mix(0.3, 0.62, smoothstep(0.1, 0.9, lum));
  float spot = exp(-dot(within, within) / (2.0 * spread * spread));
  float norm = 2.0 * 3.14159 * spread * spread;
  float dots = min(spot / min(norm, 1.0), 1.6);
  beam *= mix(1.0, dots, mask);

  vec3 halo = texture(glow, s).rgb * HALO * bloom * light;
  halo *= mix(1.0, dots, mask * 0.3);

  vec3 outc = (glass * light + beam + halo) * centre * screen(q);
  outc += (hash(gl_FragCoord.xy + floor(frame) * 17.13) - 0.5) * (1.5 / 255.0);
  color = vec4(max(outc, 0.0), 1.0);
}`;

const UNIFORMS = ["res", "px", "frame", "bloom", "zoom", "mask", "orbShift", "orbGain", "split", "tear", "seed"];

type Gpu = {
  gl: WebGL2RenderingContext;
  uniforms: Record<string, WebGLUniformLocation | null>;
  textures: WebGLTexture[];
};

function createGpu(canvas: HTMLCanvasElement): Gpu {
  const gl = canvas.getContext("webgl2", { preserveDrawingBuffer: true, antialias: false, alpha: false });
  if (!gl) throw new Error("Tube: no WebGL2");
  const shader = (type: number, src: string) => {
    const s = gl.createShader(type) as WebGLShader;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(`Tube shader: ${gl.getShaderInfoLog(s)}`);
    return s;
  };
  const program = gl.createProgram();
  gl.attachShader(program, shader(gl.VERTEX_SHADER, VERTEX));
  gl.attachShader(program, shader(gl.FRAGMENT_SHADER, FRAGMENT));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS))
    throw new Error(`Tube program: ${gl.getProgramInfoLog(program)}`);
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const p = gl.getAttribLocation(program, "p");
  gl.enableVertexAttribArray(p);
  gl.vertexAttribPointer(p, 2, gl.FLOAT, false, 0, 0);
  const textures = ["signal", "glow", "orb"].map((name, unit) => {
    const t = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(gl.getUniformLocation(program, name), unit);
    return t;
  });
  const uniforms: Gpu["uniforms"] = {};
  for (const name of UNIFORMS) uniforms[name] = gl.getUniformLocation(program, name);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  return { gl, uniforms, textures };
}

/** Holds the frame until the font has loaded, and re-renders before letting it go. */
function useFont() {
  const [ready, setReady] = useState(false);
  useLayoutEffect(() => {
    // Always load: document.fonts.check() is true before the font's faces are
    // registered, and the first frame drew in a fallback serif.
    waitFor(
      document.fonts.ready
        .then(() => Promise.all([document.fonts.load(FONT), document.fonts.load(NAME_FONT)]))
        .then(() => flushSync(() => setReady(true))),
      "Tube fonts",
    );
  }, []);
  return ready;
}

// --- Seeded noise, so every frame is the same on every render -----------------

const hash = (x: number, y = 0) => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/** The orb's edge: a few slow waves around it, -1 to 1. */
const WAVES = [2, 3, 4, 5, 7].map((k, i) => ({
  k,
  phase: hash(i, 3) * 6.283,
  speed: (hash(i, 5) - 0.5) * 2.4,
  w: 1 / k,
}));
const WAVE_SUM = WAVES.reduce((n, w) => n + w.w, 0);
function edge(theta: number, phase: number) {
  let n = 0;
  for (const w of WAVES) n += w.w * Math.sin(w.k * theta + w.phase + w.speed * phase);
  return n / WAVE_SUM;
}

/** Distance from the centre to the edge of a rounded box (half sizes hx, hy, corner rc), along angle theta. */
function boxRadius(theta: number, hx: number, hy: number, rc: number) {
  const dx = Math.cos(theta);
  const dy = Math.sin(theta);
  const sdf = (d: number) => {
    const qx = Math.abs(dx * d) - (hx - rc);
    const qy = Math.abs(dy * d) - (hy - rc);
    return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - rc;
  };
  let lo = 0;
  let hi = Math.hypot(hx, hy);
  for (let i = 0; i < 22; i++) {
    const mid = (lo + hi) / 2;
    if (sdf(mid) < 0) lo = mid;
    else hi = mid;
  }
  return lo;
}

/** The glitch over the whisper: from a light shiver up to its hardest on the count, and clean at its end. */
function glitchAt(t: number, glitch: Cues["glitch"]) {
  if (!glitch || t < glitch.from || t >= glitch.to) return 0;
  const { from, to, peak } = glitch;
  const mid = (peak[0] + peak[1]) / 2;
  if (t < mid) return interpolate(t, [from, from + 0.12, mid], [0, 0.4, 1], { easing: ease.inOut });
  return interpolate(t, [mid, to], [1, 0], { easing: ease.in });
}

// --- The scene ---------------------------------------------------------------

export function Tube({ cues, levels, mask = 0.5 }: { cues: Cues; levels: Levels; mask?: number }) {
  const frame = useFrame();
  const { fps, width, height } = useVideoInfo();
  const ready = useFont();
  const voice = useMemo(() => audioLevels(levels), [levels]);
  const canvas = useRef<HTMLCanvasElement>(null);
  const gpu = useRef<Gpu | null>(null);
  const layers = useMemo(() => {
    const make = (scale: number) => {
      const c = document.createElement("canvas");
      c.width = width / scale;
      c.height = height / scale;
      return c.getContext("2d") as CanvasRenderingContext2D;
    };
    return { signal: make(SIGNAL), orb: make(SIGNAL), glow: make(GLOW) };
  }, [width, height]);

  const advance = useMemo(() => {
    const measure = (font: string, size: number) => {
      layers.signal.font = font;
      return (ready ? layers.signal.measureText("0").width : size * 0.6) + size * 0.04;
    };
    return { logo: measure(FONT, SIZE), name: measure(NAME_FONT, NAME_SIZE) };
  }, [layers, ready]);

  // Each line glides to stay centred as it grows: one spring per change of length.
  const centring = useMemo(() => {
    const targets = (keys: Key[]) => {
      let length = lineAt(keys, 0).glyphs.length;
      const out = [{ at: 0, to: length }];
      for (const key of keys) {
        if (key.at <= 0) continue;
        const next = lineAt(keys, key.at).glyphs.length;
        if (next !== length) out.push({ at: key.at * fps, to: next });
        length = next;
      }
      return out;
    };
    return { logo: targets(cues.logo), name: targets(cues.under.keys) };
  }, [cues, fps]);

  useLayoutEffect(() => {
    if (!ready || !canvas.current) return;
    gpu.current ??= createGpu(canvas.current);
    const { gl, uniforms, textures } = gpu.current;
    const t = frame / fps;

    // --- Where things are
    const logoLength = springTo(frame, fps, centring.logo, { duration: 0.8 * fps });
    const logoLeft = width / 2 - (logoLength * advance.logo) / 2;
    const baseline = height / 2 + SIZE * 0.36;
    const nameLength = springTo(frame, fps, centring.name, { duration: 0.5 * fps });
    const nameLeft = width / 2 - (nameLength * advance.name) / 2;
    const centre = { x: width / 2 + 0.5, y: baseline - SIZE * 0.3 };
    // Under the orb; rising to sit under the logo line where the cues say.
    const lift = cues.under.lift ? interpolate(t, cues.under.lift, [0, 1], { easing: ease.inOut }) : 0;
    const nameBaseline = centre.y + RADIUS + 128 + (baseline + UNDER_LOGO - (centre.y + RADIUS + 128)) * lift;

    // --- The orb: 0 is the caret, 1 is round
    const melt = interpolate(t, [cues.birth, cues.birth + MELT], [0, 1], { easing: ease.out });
    const back = interpolate(t, cues.back, [0, 1], { easing: ease.inOut });
    const round = melt * (1 - back);
    // It listens while it is an orb, and quiets as it goes back.
    const react = melt * (1 - interpolate(back, [0, 0.6], [0, 1], { easing: ease.out }));
    const rms = voice.at(t, "rms");
    const low = voice.smooth(t, 0.8, "low");
    const mid = voice.at(t, "mid");
    const high = voice.at(t, "high");
    const pulse = voice.pulse(t, 0.08);
    const breath = Math.sin(2 * Math.PI * 0.2 * (t - cues.birth)) * 0.015;
    // Speech keeps the level high, so the orb follows each syllable's rise and fall around it.
    const syllable = rms - voice.smooth(t, 0.6, "rms");
    const radius = RADIUS * (1 + round * breath + react * (0.08 * rms + 0.03 * low + 0.24 * syllable + 0.03 * pulse));
    const wobble = 0.006 + react * 0.06 * mid;
    const phase = 0.35 * t + 3 * voice.accumulate(t, "mid");
    const shift = 0.5 + react * Math.min(7.5, 5 * high ** 1.5 + 3 * pulse);
    const angle = 0.35 * Math.sin(2 * Math.PI * 0.07 * t);

    // --- The glitch, in bursts of three frames
    const glitch = glitchAt(t, cues.glitch);
    const block = Math.floor(frame / 3);
    const burst = glitch > 0 && hash(block, 11) < 0.25 + 0.6 * glitch ? 1 : 0;
    const jerk = burst && hash(block, 13) < 0.7 ? (hash(block, 17) - 0.5) * 2 * 26 * glitch : 0;

    // --- The signal: lines now, over the fading afterglow of the last few frames
    const s = layers.signal;
    s.setTransform(1 / SIGNAL, 0, 0, 1 / SIGNAL, 0, 0);
    s.globalCompositeOperation = "source-over";
    s.globalAlpha = 1;
    s.fillStyle = "#000";
    s.fillRect(0, 0, width, height);
    s.textBaseline = "alphabetic";
    s.globalCompositeOperation = "lighten";
    s.fillStyle = "#fff";
    const draw = (line: Line, left: number, base: number, size: number, step: number, caret: boolean) => {
      for (const [i, g] of line.glyphs.entries()) s.fillText(g.char, left + i * step + size * 0.02, base);
      if (caret) s.fillRect(left + line.caret * step - 3 * (size / SIZE), base - size * 0.8, 7 * (size / SIZE), size);
    };
    for (let k = PERSIST.length - 1; k >= 0; k--) {
      const at = t - k / 60;
      s.globalAlpha = PERSIST[k];
      // The logo's caret: blinking before the orb, the orb itself while it is one, then solid until the next key.
      const logo = lineAt(cues.logo, at);
      const shown =
        (at < cues.birth && caretOn(at, Math.max(logo.lastKey, cues.birth - 2))) ||
        (at >= cues.back[1] && caretOn(at, Math.max(logo.lastKey, cues.back[1])));
      s.font = FONT;
      draw(
        logo,
        logoLeft + (k === 0 ? jerk : 0),
        baseline,
        SIZE,
        advance.logo,
        shown && !(burst && hash(block, 19) < 0.25),
      );
      const under = lineAt(cues.under.keys, at);
      const [caretFrom, caretTo] = cues.under.caret;
      s.font = NAME_FONT;
      draw(
        under,
        nameLeft,
        nameBaseline,
        NAME_SIZE,
        advance.name,
        at >= caretFrom && at < caretTo && caretOn(at, under.lastKey),
      );
    }

    // --- The orb's signal: a rounded box between the caret and a circle, its edge alive with the voice
    const o = layers.orb;
    o.setTransform(1 / SIGNAL, 0, 0, 1 / SIGNAL, 0, 0);
    o.globalCompositeOperation = "source-over";
    o.globalAlpha = 1;
    o.filter = "none";
    o.fillStyle = "#000";
    o.fillRect(0, 0, width, height);
    const orbOn = t >= cues.birth && t < cues.back[1];
    if (orbOn) {
      const hx = 3.5 + (radius - 3.5) * round;
      const hy = SIZE / 2 + (radius - SIZE / 2) * round;
      const rc = radius * round;
      o.beginPath();
      const N = 480;
      for (let i = 0; i <= N; i++) {
        const theta = (i / N) * 2 * Math.PI;
        const r = boxRadius(theta, hx, hy, rc) * (1 + round * wobble * edge(theta, phase));
        const x = centre.x + Math.cos(theta) * r;
        const y = centre.y + Math.sin(theta) * r;
        if (i === 0) o.moveTo(x, y);
        else o.lineTo(x, y);
      }
      // Brighter inside, softer at the rim: a sphere of light, not a disc.
      const fill = o.createRadialGradient(centre.x, centre.y, 0, centre.x, centre.y, Math.max(hx, hy));
      const v = (x: number) =>
        `rgb(${Array(3)
          .fill(Math.round(255 * x))
          .join(",")})`;
      fill.addColorStop(0, v(1));
      fill.addColorStop(0.3, v(1 - 0.08 * round));
      fill.addColorStop(0.7, v(1 - 0.45 * round));
      fill.addColorStop(0.9, v(1 - 0.66 * round));
      fill.addColorStop(1, v(1 - 0.62 * round));
      o.fillStyle = fill;
      o.filter = `blur(${(1.2 * round).toFixed(2)}px)`;
      o.fill();
      o.filter = "none";
    }

    // --- The glow: both signals blurred at three sizes, and a strike on each glyph as it is typed
    const g = layers.glow;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = "source-over";
    g.globalAlpha = 1;
    g.filter = "none";
    g.fillStyle = "#000";
    g.fillRect(0, 0, g.canvas.width, g.canvas.height);
    g.globalCompositeOperation = "lighter";
    for (const [blur, alpha] of [
      [1.5, 0.55],
      [5, 0.45],
      [16, 0.4],
    ]) {
      g.filter = `blur(${blur}px)`;
      g.globalAlpha = alpha;
      g.drawImage(s.canvas, 0, 0, g.canvas.width, g.canvas.height);
      if (orbOn) {
        g.globalAlpha = alpha * (1 - 0.45 * round);
        g.drawImage(o.canvas, 0, 0, g.canvas.width, g.canvas.height);
      }
    }
    g.filter = "blur(3px)";
    g.setTransform(1 / GLOW, 0, 0, 1 / GLOW, 0, 0);
    g.fillStyle = "#fff";
    const strike = (line: Line, left: number, base: number, step: number, size: number) => {
      for (const [i, glyph] of line.glyphs.entries()) {
        const a = Math.exp(-(t - glyph.born) / 0.09);
        if (a < 0.01) continue;
        g.globalAlpha = 0.7 * a;
        g.fillText(glyph.char, left + i * step + size * 0.02, base);
      }
    };
    g.font = FONT;
    strike(lineAt(cues.logo, t), logoLeft, baseline, advance.logo, SIZE);
    g.font = NAME_FONT;
    strike(lineAt(cues.under.keys, t), nameLeft, nameBaseline, advance.name, NAME_SIZE);
    g.filter = "none";

    const dpr = canvas.current.width / width;
    gl.viewport(0, 0, canvas.current.width, canvas.current.height);
    for (const [unit, source] of [s.canvas, g.canvas, o.canvas].entries()) {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, textures[unit]);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    }
    gl.uniform2f(uniforms.res, canvas.current.width, canvas.current.height);
    gl.uniform1f(uniforms.px, dpr);
    gl.uniform1f(uniforms.frame, frame);
    gl.uniform1f(uniforms.bloom, 1 + 0.35 * react * rms);
    // A slow push over the whole intro, so the frame never sits still.
    gl.uniform1f(uniforms.zoom, interpolate(t, [0, cues.end], [1, 1.05], { easing: ease.inOut }));
    gl.uniform1f(uniforms.mask, mask);
    gl.uniform2f(uniforms.orbShift, (Math.cos(angle) * shift) / 1920, (Math.sin(angle) * shift) / 1080);
    gl.uniform1f(uniforms.orbGain, 1 - 0.2 * round + 0.3 * react * rms);
    gl.uniform1f(uniforms.split, burst ? 16 * glitch : 3 * glitch);
    gl.uniform1f(uniforms.tear, burst && hash(block, 23) < 0.6 ? glitch : 0);
    gl.uniform1f(uniforms.seed, block % 97);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  });

  const dpr = typeof window === "undefined" ? 1 : window.devicePixelRatio;
  return (
    <canvas
      ref={canvas}
      width={width * dpr}
      height={height * dpr}
      style={{ position: "absolute", inset: 0, width, height, display: "block" }}
    />
  );
}
