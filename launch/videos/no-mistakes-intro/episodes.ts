// The narration and what changes per episode. Plain data, no React or browser
// code: `node videos/no-mistakes-intro/build.ts` imports it too.
//
// The narration was generated with ElevenLabs, voice "Matilda" (a default
// voice). It is the same in every episode except the last line, whispered:
// "(Tässä jaksossa on <count> virhettä.)" with the tag [almost whispering].
// For a new episode, generate only that line with the same voice and settings,
// save it as audio/<episode>/…whispered.wav in the no-mistakes folder, add the
// episode below and copy videos/no-mistakes-intro-ep02/.

/** The recordings, kept with the no-mistakes intro (relative to this folder). */
export const SOURCE = "../no-mistakes/audio/intro";

/**
 * The narration up to "Ei virheitä.", in order, and what each chapter says (from intro-speak-fi.srt).
 * `pause` is silence added before a chapter: the script asks for a [long pause]
 * between the first two paragraphs, and the voice did not make one.
 */
export const CHAPTERS: { file: string; text: string; pause?: number }[] = [
  {
    file: "shared/1_Chapter_1.wav",
    text: "Tervetuloa Ei virheitä -podcastin pariin. Podcast tekoälystä ja teknologiasta.",
  },
  {
    file: "shared/2_Chapter_1.wav",
    pause: 1,
    text: "Keskustelijoina ovat Mikko Harju, Valtteri Karesto… ja Joni Juup. Mikko on Taisteen…",
  },
  { file: "shared/3_Chapter_1.wav", text: "Kaikkia kolmea yhdistää pitkä historia teknologian parissa…" },
  { file: "shared/4_Chapter_1.wav", text: "Ja nyt, hyvät kuulijat… Ei virheitä." },
];

export type Episode = { id: string; count: string; whisper: string };

export const EPISODES: Record<string, Episode> = {
  ep01: { id: "ep01", count: "viisi", whisper: "ep01/tassa-jaksossa-on-viisi-virhetta-whispered.wav" },
  ep02: { id: "ep02", count: "neljä", whisper: "ep02/tassa-jaksossa-on-neljä-virhetta-whispered.wav" },
};

export const whispered = (e: Episode) => `Tässä jaksossa on ${e.count} virhettä`;

/** The first word lands this long after the first frame, as the caret's second blink comes on. */
export const FIRST_WORD = 1;
/** Silence after the narration, so the picture can hold the logo. */
export const TAIL = 2.5;

/** Where each part of the narration sits in an episode's track (seconds), written by build.ts. */
export type Track = {
  lead: number;
  chapters: { start: number; end: number }[];
  whisper: { start: number; end: number };
};
