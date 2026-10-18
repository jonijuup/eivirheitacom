// Builds audio/mix/no-mistakes.wav: the track, with one keystroke from the
// typing recording on every key in script.ts. The video plays one audio file,
// so the keystrokes are mixed in here rather than at render time.
//
//   node videos/no-mistakes/mix.ts
//
// Run it again after changing the timing in script.ts.

import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { KEYS, type KeyKind, LENGTH } from "./script.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const MUSIC = join(HERE, "audio/digital-dawn.wav");
const TYPING = join(HERE, "audio/sfx/keyboard-typing.wav");
const OUT = join(HERE, "audio/mix/no-mistakes.wav");
const RATE = 48000;

/** Peak of every keystroke in the mix (dBFS), and each kind's level against it. */
const KEY_PEAK = -9;
const KIND_GAIN: Record<KeyKind, number> = { char: 1, back: 1.1, left: 0.6, right: 0.6 };

function decode(file: string): Float32Array {
  const raw = execFileSync("ffmpeg", ["-v", "error", "-i", file, "-f", "f32le", "-ac", "2", "-ar", String(RATE), "-"], {
    maxBuffer: 1 << 30,
  });
  return new Float32Array(raw.buffer, raw.byteOffset, raw.byteLength / 4);
}

/** Single keystrokes in the recording: strong onsets at least 150 ms apart. */
function keystrokes(typing: Float32Array): Float32Array[] {
  const hop = RATE / 1000;
  const frames = typing.length / 2;
  const db: number[] = [];
  for (let i = 0; i + hop <= frames; i += hop) {
    let sum = 0;
    for (let j = i; j < i + hop; j++) sum += ((typing[j * 2] + typing[j * 2 + 1]) / 2) ** 2;
    db.push(10 * Math.log10(sum / hop + 1e-12));
  }
  const top = Math.max(...db);
  const starts: number[] = [];
  for (let ms = 1; ms < db.length; ms++) {
    if (db[ms] <= top - 30 || db[ms - 1] > top - 30) continue;
    const peak = Math.max(...db.slice(ms, ms + 30));
    // Presses are loud; the release that follows 60 to 80 ms later is not.
    if (peak > top - 12 && ms - (starts.at(-1) ?? -1000) > 150) starts.push(ms);
  }
  return starts.map((ms, i) => {
    const from = (ms - 3) * hop;
    const to = Math.min(((starts[i + 1] ?? ms + 400) - 5) * hop, (ms + 230) * hop, frames);
    const slice = new Float32Array(to - from);
    let peak = 0;
    for (let j = 0; j < slice.length; j++) {
      slice[j] = (typing[(from + j) * 2] + typing[(from + j) * 2 + 1]) / 2;
      peak = Math.max(peak, Math.abs(slice[j]));
    }
    const fade = Math.min(slice.length, 0.03 * RATE);
    for (let j = 0; j < slice.length; j++) {
      slice[j] /= peak;
      const k = slice.length - j;
      if (k < fade) slice[j] *= k / fade;
    }
    return slice;
  });
}

const music = decode(MUSIC);
const strokes = keystrokes(decode(TYPING));
const mix = new Float32Array(Math.round(LENGTH * RATE) * 2);
mix.set(music.subarray(0, mix.length));

let last = -1;
for (const [i, key] of KEYS.entries()) {
  // A different keystroke from the one before, chosen the same way on every run.
  let pick = (i * 7 + 3) % strokes.length;
  if (pick === last) pick = (pick + 1) % strokes.length;
  last = pick;
  const slice = strokes[pick];
  const gain = 10 ** (KEY_PEAK / 20) * KIND_GAIN[key.kind];
  const at = Math.round((key.at - 0.003) * RATE);
  for (let j = 0; j < slice.length && (at + j) * 2 + 1 < mix.length; j++) {
    mix[(at + j) * 2] += slice[j] * gain;
    mix[(at + j) * 2 + 1] += slice[j] * gain;
  }
}

// The track alone sits near -17 LUFS with little headroom: raise the mix to the
// -14 LUFS delivery target and limit it, oversampled, so true peaks stay under -1 dBTP.
const MASTER = [
  "volume=3.2dB",
  "aresample=192000",
  "alimiter=limit=0.84:attack=2:release=60:level=false",
  `aresample=${RATE}`,
];
execFileSync(
  "ffmpeg",
  [
    "-v",
    "error",
    "-y",
    "-f",
    "f32le",
    "-ac",
    "2",
    "-ar",
    String(RATE),
    "-i",
    "-",
    "-af",
    MASTER.join(","),
    "-c:a",
    "pcm_s24le",
    OUT,
  ],
  { input: Buffer.from(mix.buffer) },
);
console.log(`  ${OUT.slice(HERE.length + 1)} · ${KEYS.length} keys from ${strokes.length} keystrokes`);
