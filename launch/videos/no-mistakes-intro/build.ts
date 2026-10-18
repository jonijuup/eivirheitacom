// Builds an episode's track: the shared narration and the episode's whispered
// line, end to end with the pauses in CHAPTERS, a lead-in and a silent tail.
// The recordings are placed sample for sample as generated (same rate, depth
// and channels; no gain, no resampling): only silence is added. Writes
// audio/<episode>/intro.wav, track.json (where each chapter sits) and, through
// `pnpm launch levels`, intro.levels.json (what the orb moves with).
//
//   node videos/no-mistakes-intro/build.ts ep01 [ep02 …]

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CHAPTERS, EPISODES, FIRST_WORD, SOURCE, TAIL, type Track } from "./episodes.ts";

const HERE = dirname(fileURLToPath(import.meta.url));

/** The recording's own format, which the track keeps. */
function format(file: string) {
  const [codec, rate, channels] = execFileSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "stream=codec_name,sample_rate,channels", "-of", "csv=p=0", file],
    { encoding: "utf8" },
  )
    .trim()
    .split(",");
  return { codec, rate: Number(rate), channels: Number(channels) };
}

/** 16-bit samples, as stored. */
function decode(file: string): Int16Array {
  const raw = execFileSync("ffmpeg", ["-v", "error", "-i", file, "-f", "s16le", "-"], { maxBuffer: 1 << 30 });
  return new Int16Array(raw.buffer, raw.byteOffset, raw.byteLength / 2);
}

/** Where the voice starts in a recording (seconds): the first 10 ms within 35 dB of its peak. */
function onset(samples: Int16Array, rate: number) {
  const hop = Math.round(rate / 100);
  let peak = 0;
  for (const x of samples) peak = Math.max(peak, Math.abs(x));
  for (let i = 0; i + hop <= samples.length; i += hop) {
    let sum = 0;
    for (let j = i; j < i + hop; j++) sum += samples[j] ** 2;
    if (Math.sqrt(sum / hop) > peak * 10 ** (-35 / 20)) return i / rate;
  }
  return 0;
}

const ids = process.argv.slice(2);
if (!ids.length) throw new Error(`Which episode? ${Object.keys(EPISODES).join(", ")}`);
for (const id of ids) {
  const episode = EPISODES[id];
  if (!episode) throw new Error(`No episode ${id}`);
  const files = [...CHAPTERS.map((c) => c.file), episode.whisper].map((f) => join(HERE, SOURCE, f));
  const pauses = [...CHAPTERS.map((c) => c.pause ?? 0), 0];
  const formats = files.map(format);
  const { rate, channels } = formats[0];
  if (formats.some((f) => f.codec !== "pcm_s16le" || f.rate !== rate || f.channels !== channels))
    throw new Error(`The recordings differ in format: ${JSON.stringify(formats)}`);
  const parts = files.map(decode);
  const lead = Math.max(0.5, FIRST_WORD - onset(parts[0], rate));

  // Positions in whole samples, so nothing is resampled.
  const spans: { start: number; end: number }[] = [];
  let at = Math.round(lead * rate);
  const offsets: number[] = [];
  for (const [i, p] of parts.entries()) {
    at += Math.round(pauses[i] * rate);
    offsets.push(at);
    spans.push({ start: at / rate, end: (at + p.length / channels) / rate });
    at += p.length / channels;
  }
  const track = new Int16Array((at + Math.round(TAIL * rate)) * channels);
  for (const [i, p] of parts.entries()) track.set(p, offsets[i] * channels);

  const dir = join(HERE, "audio", id);
  mkdirSync(dir, { recursive: true });
  execFileSync(
    "ffmpeg",
    [
      ...["-v", "error", "-y", "-f", "s16le", "-ar", String(rate), "-ac", String(channels), "-i", "-"],
      ...["-c:a", "pcm_s16le", join(dir, "intro.wav")],
    ],
    { input: Buffer.from(track.buffer) },
  );

  const t: Track = { lead, chapters: spans.slice(0, -1), whisper: spans[spans.length - 1] };
  writeFileSync(join(dir, "track.json"), `${JSON.stringify(t, null, 2)}\n`);
  console.log(`  ${id}: ${(track.length / channels / rate).toFixed(2)}s, lead ${lead.toFixed(3)}s`);
  execFileSync("pnpm", ["launch", "levels", "no-mistakes-intro", `audio/${id}/intro.wav`], { stdio: "inherit" });
}
