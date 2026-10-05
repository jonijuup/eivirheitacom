# eivirheita.com

The site of the Ei virheitä podcast: the intro's CRT tube as a web page. Astro, static, no client framework.

```sh
pnpm install
pnpm dev      # dithers the artwork, then http://localhost:4321
pnpm build    # dist/, as Netlify builds it (netlify.toml)
```

## Where things are

- `src/data/site.ts`: the show, the hosts, and the listen links (`PLATFORMS`; a `null` link shows as "Tulossa").
- `src/data/episodes.ts`: the episodes, newest first.
- `media/episodes/<nn>.png`: each episode's artwork, in colour. `scripts/dither.mjs` turns it into the phosphor dither in `public/media/` (generated, not committed) and cuts the host portraits from episode 1.
- `content/transcripts/<nn>.srt`: subtitles, shown as the episode's transcript.
- `src/styles/global.css`: the tube (phosphor glow, fringes, dot mask, fades) and the grid.
- `public/og.png`: the share card, a screenshot of `/og/`. It is committed, since Netlify's build has no browser; after changing the card or the show's name, tagline or hosts, run `pnpm build && pnpm og` and commit the new image. Episode pages share their own artwork instead.
- `/dither/`: the dither lab (not linked or indexed). It shows every style side by side, with full-size downloads for podcast artwork. Change the site's style with `STYLE` in `scripts/dither.mjs`.

## A new episode

1. Save the artwork as `media/episodes/02.png` and add `{ id: "02", src: "media/episodes/02.png" }` to `EPISODES` in `scripts/dither.mjs`.
2. Save the subtitles as `content/transcripts/02.srt`.
3. Add the episode at the top of `EPISODES` in `src/data/episodes.ts`: title, slug, date, length in seconds (from the feed), the number of mistakes from the intro, description, topics, transcript file, and links.

## For agents

Every page has a Markdown twin linked with `<link rel="alternate" type="text/markdown">`: `/index.md` and `/jaksot/<slug>.md`, which includes the full transcript. `/llms.txt` lists them, and `/llms-full.txt` has everything in one file. The pages carry schema.org `PodcastSeries` / `PodcastEpisode` JSON-LD.
