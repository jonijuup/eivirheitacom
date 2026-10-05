// Episode subtitles (SRT) as a readable transcript: cues in time order, joined
// into paragraphs at pauses, each paragraph with its start time.

import { readFileSync } from "node:fs";
import { join } from "node:path";

export type Paragraph = { start: number; text: string };

type Cue = { start: number; end: number; text: string };

const seconds = (stamp: string) => {
  const [h, m, rest] = stamp.split(":");
  const [s, ms] = rest.split(",");
  return Number(h) * 3600 + Number(m) * 60 + Number(s) + Number(ms) / 1000;
};

function parse(srt: string): Cue[] {
  return srt
    .replace(/\r/g, "")
    .trim()
    .split(/\n\s*\n/)
    .map((block) => {
      const lines = block.split("\n");
      const timing = lines.findIndex((l) => l.includes("-->"));
      if (timing < 0) return null;
      const [a, b] = lines[timing].split("-->").map((s) => s.trim());
      const text = lines
        .slice(timing + 1)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      return text ? { start: seconds(a), end: seconds(b), text } : null;
    })
    .filter((c): c is Cue => c !== null)
    .sort((x, y) => x.start - y.start);
}

/** A new paragraph after a pause this long (s), or once a paragraph is this long and a sentence ends. */
const PAUSE = 1.2;
const LONG = 420;

export function transcript(file: string): Paragraph[] {
  const cues = parse(readFileSync(join(process.cwd(), "content/transcripts", file), "utf8"));
  const out: Paragraph[] = [];
  let current: Paragraph | null = null;
  let lastEnd = -Infinity;
  for (const cue of cues) {
    const breaks =
      !current || cue.start - lastEnd > PAUSE || (current.text.length > LONG && /[.?!]$/.test(current.text));
    if (breaks) {
      current = { start: cue.start, text: cue.text };
      out.push(current);
    } else if (current) {
      current.text += ` ${cue.text}`;
    }
    lastEnd = Math.max(lastEnd, cue.end);
  }
  return out;
}

export const timestamp = (t: number) => {
  const s = Math.floor(t);
  const h = Math.floor(s / 3600);
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};
