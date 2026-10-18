// When things happen, from an episode's track: where each chapter sits
// (track.json, from build.ts) and the phrases heard in it (intro.levels.json).
// Nothing here is in seconds by hand, so a re-generated narration or a new
// episode's whisper re-times the picture on its own. Words inside a phrase are
// placed by their syllables: close to the voice, not on the dot.

import type { Levels } from "@intentface-launch/core";
import type { Track } from "./episodes.ts";

export type Key = { at: number; kind: "char" | "back"; char?: string };
export type Glyph = { char: string; born: number };
export type Line = { glyphs: Glyph[]; caret: number; lastKey: number };

/** What the tube does when (seconds). Shared by the intro and the outro (videos/no-mistakes-outro). */
export type Cues = {
  /** The caret melts into the orb as the voice starts. */
  birth: number;
  /** The logo line: keys before 0 are already typed on the first frame. */
  logo: Key[];
  /**
   * The line under the orb (the hosts' names, a web address): its keys, when
   * its caret shows, and when it rises to sit under the logo line, if it does.
   */
  under: { keys: Key[]; caret: [number, number]; lift?: [number, number] };
  /** The orb settles and shrinks back into the caret. */
  back: [number, number];
  /** The logo glitches from `from` to `to`, hardest at `peak`. */
  glitch?: { from: number; to: number; peak: [number, number] };
  /** The last frame. */
  end: number;
};

/** The phrases inside a span, clipped to it; breaths and blips under 0.2 s left out. */
export function phrasesIn(levels: Levels, { start, end }: { start: number; end: number }) {
  return levels.phrases
    .map(([s, e]) => [Math.max(s, start), Math.min(e, end)] as [number, number])
    .filter(([s, e]) => e - s >= 0.2);
}

const syllables = (word: string) => Math.max(1, word.match(/[aeiouyäöå]+/gi)?.length ?? 0);

/** When each character of `text` is said, if its words share [start, end] by syllables. */
export function spread(text: string, start: number, end: number): number[] {
  const words = [...text.matchAll(/\S+/g)];
  const total = words.reduce((n, w) => n + syllables(w[0]), 0);
  const times = new Array<number>(text.length).fill(end);
  let done = 0;
  for (const w of words) {
    const from = start + ((end - start) * done) / total;
    done += syllables(w[0]);
    const to = start + ((end - start) * done) / total;
    for (let i = 0; i < w[0].length; i++) times[w.index + i] = from + ((to - from) * i) / w[0].length;
    if (w.index + w[0].length < text.length) times[w.index + w[0].length] = to;
  }
  return times;
}

/** `part` of a phrase that says `said`, typed as it is spoken: one key per character. */
function typedAsSaid(said: string, part: string, [start, end]: [number, number]): Key[] {
  const at = said.indexOf(part);
  if (at < 0) throw new Error(`"${part}" is not in "${said}"`);
  const times = spread(said, start, end);
  return [...part].map((char, i) => ({ at: times[at + i], kind: "char", char }));
}

/** Backspaces quick enough to clear `count` characters, starting at `at`. */
export const erase = (count: number, at: number, gap = 0.028): Key[] =>
  Array.from({ length: count }, (_, i) => ({ at: at + i * gap, kind: "back" }));

/** Squeeze keys into [from, to], keeping their rhythm. */
function fit(keys: Key[], from: number, to: number): Key[] {
  const a = keys[0].at;
  const b = keys[keys.length - 1].at;
  if (a >= from) return keys;
  return keys.map((k) => ({ ...k, at: from + ((k.at - a) / Math.max(b - a, 1e-6)) * Math.max(to - from, 0) }));
}

export const BLINK = 1;

/** The intro: "Tervetuloa…" to the whispered count. */
export function cues(track: Track, levels: Levels, whisper: string): Cues {
  const [first] = phrasesIn(levels, track.chapters[0]);
  const birth = first[0];

  // Chapter 2: "Keskustelijoina ovat Mikko Harju," / "Valtteri Karesto…" / "ja Joni Juup." / "Mikko on …"
  const [p1, p2, p3, p4] = phrasesIn(levels, track.chapters[1]);
  const said = [
    typedAsSaid("Keskustelijoina ovat Mikko Harju", "Mikko Harju", p1),
    typedAsSaid("Valtteri Karesto", "Valtteri Karesto", p2),
    typedAsSaid("ja Joni Juup", "Joni Juup", p3),
  ];
  // Each name stays until the next one is said; then it is backspaced away and
  // the next one typed in what is left of its saying. The last one clears as the next sentence starts.
  const names: Key[] = [...said[0]];
  for (let i = 1; i < said.length; i++) {
    const out = erase(said[i - 1].length, said[i][0].at);
    names.push(...out, ...fit(said[i], out[out.length - 1].at + 0.05, said[i][said[i].length - 1].at));
  }
  names.push(...erase(said[2].length, p4[0]));

  // Chapter 4: "Ja nyt, hyvät kuulijat…" / "Ei virheitä."
  const ending = phrasesIn(levels, track.chapters[3]);
  const lastPhrase = ending[ending.length - 1];
  const back: [number, number] = [ending[0][0], ending[ending.length - 2][1]];
  const logo = typedAsSaid("Ei virheitä.", "Ei virheitä", lastPhrase);

  // The whisper: its longest phrase (a breath after it is not a word).
  const heard = phrasesIn(levels, track.whisper).sort((a, b) => b[1] - b[0] - (a[1] - a[0]))[0];
  const words = spread(whisper, heard[0], heard[1]);
  const count = whisper.split(" ")[3];
  const at = whisper.indexOf(count);
  const glitch = { from: heard[0], to: heard[1], peak: [words[at], words[at + count.length]] as [number, number] };

  // Hold the clean logo for about 1.25 s, and end on a lit caret.
  const anchor = logo[logo.length - 1].at;
  let end = glitch.to + 1.1;
  while ((end - anchor) % BLINK < 0.2 || (end - anchor) % BLINK > 0.45) end += 1 / 60;
  return {
    birth,
    logo,
    under: { keys: names, caret: [names[0].at, names[names.length - 1].at + 0.3] },
    back,
    glitch,
    end,
  };
}

/** The line and its caret after every key up to `t`. */
export function lineAt(keys: Key[], t: number): Line {
  const glyphs: Glyph[] = [];
  let caret = 0;
  let lastKey = Number.NEGATIVE_INFINITY;
  for (const key of keys) {
    if (key.at > t) break;
    lastKey = key.at;
    if (key.kind === "char") glyphs.splice(caret++, 0, { char: key.char ?? "", born: key.at });
    else if (caret > 0) glyphs.splice(--caret, 1);
  }
  return { glyphs, caret, lastKey };
}

/** A key restarts the blink, so the caret stays solid while typing. */
export function caretOn(t: number, since: number) {
  const s = t - since;
  return ((s % BLINK) + BLINK) % BLINK < BLINK / 2;
}
