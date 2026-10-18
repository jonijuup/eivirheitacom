// When things happen in the outro, from its track (track.json, from build.ts)
// and the phrases heard in it (outro.levels.json). The phrases follow
// audio/outro-speak-finnish.srt:
//
//   0 "Kiitos, että kuuntelit Ei virheitä -podcastia. Jos löysit jaksosta virheen,"
//   1 "kerro siitä meille kommenteissa."
//   2 "Kaikki jaksot löydät osoitteesta"
//   3 "ei virheita piste com"          → eivirheita.com is typed under the orb
//   4 "ja kuunnella voit missä vain missä laatupodcasteja yleensäkin kuunnellaan."
//   5, 6 "Muista tilata" / "ja kerro myös ystävillesi."
//   last "Ensi kertaan!"                → the orb goes back into the caret, which types the logo

import type { Levels } from "@intentface-launch/core";
import { type Cues, erase, type Key, phrasesIn, spread } from "../no-mistakes-intro/timing.ts";

/** The first word lands here: after the logo is backspaced away and the caret has blinked once. */
export const FIRST_WORD = 2;

export type OutroTrack = { lead: number; voice: { start: number; end: number } };

export const LOGO = "Ei virheitä";
export const URL = "eivirheita.com";

/** Typed by hand: about ten keys a second, a little uneven, the same on every render. */
const byHand = (text: string, at: number): Key[] =>
  [...text].map((char, i) => ({ at: at + i * 0.09 + 0.025 * Math.sin(i * 2.3), kind: "char", char }));

export function outroCues(track: OutroTrack, levels: Levels): Cues {
  const phrases = phrasesIn(levels, track.voice);
  const birth = phrases[0][0];

  // On the first frame the logo is there (typed before it); the caret takes it back before the voice starts.
  const typed = [...LOGO].map((char, i): Key => ({ at: -2 + i * 0.01, kind: "char", char }));
  const out = erase(LOGO.length, birth - 0.85, 0.05);

  // The address as it is said: each spoken word types its part ("piste" is the dot).
  const said = "ei virheita piste com";
  const parts = ["ei", "virheita", ".", "com"];
  const times = spread(said, ...phrases[3]);
  const url: Key[] = [];
  let from = 0;
  for (const [w, word] of said.split(" ").entries()) {
    const start = times[from];
    const end = times[from + word.length] ?? phrases[3][1];
    for (const [i, char] of [...parts[w]].entries())
      url.push({ at: start + ((end - start) * i) / parts[w].length, kind: "char", char });
    from += word.length + 1;
  }

  // "Ensi kertaan!": the orb goes back, the address rises under the logo line, and the caret types the logo again.
  const last = phrases[phrases.length - 1];
  const back: [number, number] = [last[0], last[1]];
  const again = byHand(LOGO, back[1] + 0.25);
  const anchor = again[again.length - 1].at;
  let end = anchor + 2;
  while ((end - anchor) % 1 < 0.2 || (end - anchor) % 1 > 0.45) end += 1 / 60;

  return {
    birth,
    logo: [...typed, ...out, ...again],
    under: { keys: url, caret: [url[0].at, back[0]], lift: back },
    back,
    end,
  };
}
