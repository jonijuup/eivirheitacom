import { NOTES } from "./notes.ts";

// The episodes, newest first. For a new one: add its artwork to media/episodes/<nn>.png
// (and to EPISODES in scripts/dither.mjs), its subtitles to content/transcripts/<nn>.srt,
// and an entry here.

export type Episode = {
  number: number;
  slug: string;
  title: string;
  /** ISO date (YYYY-MM-DD); left out until it is published. */
  date?: string;
  /** ISO date it was recorded. */
  recorded?: string;
  /** Length in seconds, as in the feed. */
  seconds: number;
  /** How many mistakes the intro says the episode has. */
  mistakes: number;
  description: string;
  topics: string[];
  /** Subtitles in content/transcripts/, used as the transcript. */
  transcript?: string;
  /** Per-episode links; a platform left out falls back to the show's link. */
  links?: Partial<Record<"spotify" | "apple" | "youtube", string>>;
};

export const EPISODES: Episode[] = [
  {
    number: 1,
    slug: "01-agi-tuli-suomen-kieli-meni",
    title: "AGI tuli, suomen kieli meni",
    date: "2026-10-04",
    recorded: "2026-09-13",
    seconds: 2676,
    mistakes: 5,
    description:
      "OpenAI julkaisi GPT-6 Astran ja puhui AGI-aikakaudesta. Samaan aikaan kielimallien suomi on mennyt huonommaksi, ja se maksaa sinulle enemmän jokaisessa pyynnössä.",
    topics: [
      "Miksi OpenAI on tekoälyfirmojen Microsoft, ja kuka on Linux",
      "Mistral, kiinalaiset avoimet painot ja eurooppalainen rauta",
      "Miksi benchmarkit eivät enää kerro mitään",
      "Miksi \"ice cream\" on kolme tokenia mutta \"jäätelöpuikko\" kahdeksan",
      "Tuhat tokenia sekunnissa: nopea inferenssi ja lennosta generoidut käyttöliittymät",
      "Kun agentti korjaa väärää projektia ja kreditit loppuvat",
      "Myötäilevä tekoäly: saat juuri sen vastauksen, jonka haluat",
    ],
    transcript: "01.srt",
    links: {
      spotify: "https://open.spotify.com/episode/5N0hlF3nt3rwTEA5AznuTk",
      apple: "https://podcasts.apple.com/us/podcast/jakso-1-agi-tuli-suomen-kieli-meni/id6819228625?i=1000793228193",
      youtube: "https://www.youtube.com/watch?v=RQwKO6B9Y8g",
    },
  },
];

export const pad = (n: number) => String(n).padStart(2, "0");
export const episodeUrl = (e: Episode) => `/jaksot/${e.slug}/`;
export const episodeImage = (e: Episode) => `/media/episodes/${pad(e.number)}.png`;
export const episodeOg = (e: Episode) => `/media/og/${pad(e.number)}.jpg`;

/** Rounded minutes, for labels: "45 min". */
export const minutes = (e: Episode) => Math.round(e.seconds / 60);
/** ISO 8601 duration, for schema.org: "PT44M36S". */
export const isoDuration = (e: Episode) => `PT${Math.floor(e.seconds / 60)}M${e.seconds % 60}S`;

/** Where to listen to an episode: its own links, else the show's. */
export const episodeLinks = (e: Episode, platforms: { id: string; name: string; href: string | null }[]) =>
  platforms.map((p) => ({ ...p, href: e.links?.[p.id as keyof NonNullable<Episode["links"]>] ?? p.href }));

/** How many mistakes the corrections found, which need not be what the intro promised. */
export const mistakesFound = (e: Episode) => NOTES[e.number]?.corrections.length ?? e.mistakes;

/** "5 virhettä", "1 virhe". */
export const mistakesLabel = (n: number) => `${n} ${n === 1 ? "virhe" : "virhettä"}`;

export const formatDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d}.${m}.${y}`;
};
