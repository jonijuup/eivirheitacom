// Builds the outro's track: the narration as generated (sample for sample, in
// its own format, no gain or resampling) after a lead-in, with a silent tail.
// Writes audio/outro.wav, audio/track.json and, through `pnpm launch levels`,
// audio/outro.levels.json (what the orb moves with).
//
//   node videos/no-mistakes-outro/build.ts

import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { FIRST_WORD, type OutroTrack } from "./timing.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
/** ElevenLabs, voice Matilda: the same voice as the intro (videos/no-mistakes-intro/episodes.ts). */
const NARRATION = join(HERE, "audio/outro-speech-finnish.wav");
const TAIL = 4;

const [codec, r, c] = execFileSync(
  "ffprobe",
  ["-v", "error", "-show_entries", "stream=codec_name,sample_rate,channels", "-of", "csv=p=0", NARRATION],
  { encoding: "utf8" },
)
  .trim()
  .split(",");
if (codec !== "pcm_s16le") throw new Error(`Expected 16-bit PCM, got ${codec}`);
const rate = Number(r);
const channels = Number(c);
const raw = execFileSync("ffmpeg", ["-v", "error", "-i", NARRATION, "-f", "s16le", "-"], { maxBuffer: 1 << 30 });
const voice = new Int16Array(raw.buffer, raw.byteOffset, raw.byteLength / 2);

// Where the voice starts: the first 10 ms within 35 dB of its peak.
const hop = Math.round(rate / 100) * channels;
let peak = 0;
for (const x of voice) peak = Math.max(peak, Math.abs(x));
let onset = 0;
for (let i = 0; i + hop <= voice.length; i += hop) {
  let sum = 0;
  for (let j = i; j < i + hop; j++) sum += voice[j] ** 2;
  if (Math.sqrt(sum / hop) > peak * 10 ** (-35 / 20)) {
    onset = i / channels / rate;
    break;
  }
}

const start = Math.round((FIRST_WORD - onset) * rate);
const frames = voice.length / channels;
const track = new Int16Array((start + frames + Math.round(TAIL * rate)) * channels);
track.set(voice, start * channels);
execFileSync(
  "ffmpeg",
  [
    ...["-v", "error", "-y", "-f", "s16le", "-ar", String(rate), "-ac", String(channels), "-i", "-"],
    ...["-c:a", "pcm_s16le", join(HERE, "audio/outro.wav")],
  ],
  { input: Buffer.from(track.buffer) },
);
const t: OutroTrack = { lead: start / rate, voice: { start: start / rate, end: (start + frames) / rate } };
writeFileSync(join(HERE, "audio/track.json"), `${JSON.stringify(t, null, 2)}\n`);
console.log(`  outro: ${(track.length / channels / rate).toFixed(2)}s, lead ${t.lead.toFixed(3)}s`);
execFileSync("pnpm", ["launch", "levels", "no-mistakes-outro", "audio/outro.wav"], { stdio: "inherit" });
