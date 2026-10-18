// What is typed, and when. Shared by the picture (video.tsx) and the sound
// (mix.ts), so every keystroke you see is a keystroke you hear. Plain data, no
// React or browser code: `node videos/no-mistakes/mix.ts` imports it too.

export const FPS = 60;
/** The track's length: the intro is exactly one play of it. */
export const LENGTH = 14.8;

export type KeyKind = "char" | "back" | "left" | "right";
export type Key = { at: number; kind: KeyKind; char?: string };

/** Beats of digital-dawn.wav (audio/beats.json) that the edits start on. */
export const BEATS = {
  /** First key of "Ei vireitä", four beats of blinking caret after the music starts. */
  type: 2.2843,
  /** Back two places to put an h in: "vireihtä", wrong again. */
  fix1: 4.2812,
  /** Take the h out, back two more, h in the right place: "virheitä". */
  fix2: 5.8921,
  /** To the end of the line and " podcats". The bass drops out here. */
  more: 7.4043,
  /** "podcats" becomes "podcast", as the bass comes back. */
  fix3: 9.9033,
  /** The full stop lands on the hit after the quiet. */
  stop: 12.7768,
};

/** Fade in from black, and out to black with the track's tail. */
export const FADE_IN = [0, 1.3] as const;
export const FADE_OUT = [13.55, 14.8] as const;

// A seeded generator (mulberry32), so the human timing is the same on every run.
// Not core's random(): this file must load in plain Node, without the engine.
let seed = 20260927;
const rng = () => {
  seed = (seed + 0x6d2b79f5) >>> 0;
  let x = Math.imul(seed ^ (seed >>> 15), seed | 1);
  x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
  return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
};
const jitter = (base: number, amount: number) => base * (1 + (rng() * 2 - 1) * amount);

function typed(text: string, at: number): Key[] {
  const keys: Key[] = [];
  let t = at;
  for (const [i, char] of [...text].entries()) {
    keys.push({ at: t, kind: "char", char });
    const next = text[i + 1];
    // A touch slower around spaces and after a capital (shift), quicker inside a word.
    t +=
      jitter(char === " " || next === " " ? 0.15 : 0.1, 0.3) +
      (char === char.toUpperCase() && /\p{L}/u.test(char) ? 0.04 : 0);
  }
  return keys;
}

function repeat(kind: KeyKind, count: number, at: number, gap = 0.12): Key[] {
  return Array.from({ length: count }, (_, i) => ({ at: at + i * jitter(gap, 0.15), kind }));
}

/** Keys in order, each after the one before. */
function chain(start: number, ...groups: ((at: number) => Key[])[]): Key[] {
  const keys: Key[] = [];
  let at = start;
  for (const group of groups) {
    const g = group(at);
    keys.push(...g);
    at = g[g.length - 1].at + jitter(0.14, 0.2);
  }
  return keys;
}

export const KEYS: Key[] = [
  ...typed("Ei vireitä", BEATS.type),
  ...chain(
    BEATS.fix1,
    (at) => repeat("left", 2, at),
    (at) => typed("h", at),
  ),
  ...chain(
    BEATS.fix2,
    (at) => repeat("back", 1, at),
    (at) => repeat("left", 2, at),
    (at) => typed("h", at),
  ),
  ...chain(
    BEATS.more,
    (at) => repeat("right", 4, at, 0.09),
    (at) => typed(" podcats", at),
  ),
  ...chain(
    BEATS.fix3,
    (at) => repeat("back", 2, at, 0.13),
    (at) => typed("st", at),
  ),
  { at: BEATS.stop, kind: "char", char: "." },
];

export type Glyph = { char: string; id: number; born: number };
export type Line = { glyphs: Glyph[]; caret: number; lastKey: number };

/** The line and caret after every key up to time `t` (seconds). */
export function lineAt(t: number): Line {
  const glyphs: Glyph[] = [];
  let caret = 0;
  let lastKey = Number.NEGATIVE_INFINITY;
  for (const [id, key] of KEYS.entries()) {
    if (key.at > t) break;
    lastKey = key.at;
    if (key.kind === "char") glyphs.splice(caret++, 0, { char: key.char ?? "", id, born: key.at });
    else if (key.kind === "back" && caret > 0) glyphs.splice(--caret, 1);
    else if (key.kind === "left") caret = Math.max(0, caret - 1);
    else if (key.kind === "right") caret = Math.min(glyphs.length, caret + 1);
  }
  return { glyphs, caret, lastKey };
}
