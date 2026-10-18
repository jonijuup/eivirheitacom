# Ei virheitä: the spoken intro

## Audience

Listeners of the Ei virheitä podcast. This is the spoken intro after the sonic logo (`videos/no-mistakes`, which stays as it is): about 45 s, one render per episode.

## What it shows

- The logo's world: the no-mistakes CRT, black glass, IBM Plex Mono, its glow and dot mask. Nothing new in style.
- A blinking caret that melts into an orb as the voice starts. The orb is white light on black with the tube's texture, colour only as red and blue fringes that open with the voice. It breathes at rest and moves with each syllable, never like jelly.
- The three hosts' names typed under the orb as they are said, each backspaced away as the next is said, cleared when the next sentence starts. No roles, no other text.
- "Ja nyt, hyvät kuulijat…": the orb calms and shrinks back into the caret. "Ei virheitä" is typed with the voice.
- The whispered count of this episode's mistakes: the logo glitches (colour split, torn lines, a jumping caret), hardest on the number, and is clean again when the whisper ends. No number on screen. Then the clean logo holds with its caret lit, and cut.

## Facts

Only the hosts' names, as the narration says them: Mikko Harju, Valtteri Karesto, Joni Juup.

## Length, format

The narration plus about 1.25 s of hold, 1920×1080, 60 fps. The narration's loudness is as generated: not normalised.

## Sound

- The narration was generated with ElevenLabs, voice **Matilda** (a default voice), in parts: `videos/no-mistakes/audio/intro/shared/1…4_Chapter_1.wav` (everything up to "Ei virheitä.") and one whispered line per episode in `ep01/`, `ep02/` ("[almost whispering] (Tässä jaksossa on viisi / neljä virhettä.)"). `intro-speak-fi.srt` is the whole of episode 1, for reference.
- The audio is used as generated: never normalised, limited or resampled. `node videos/no-mistakes-intro/build.ts ep01` places the shared chapters and the episode's whisper sample for sample (44.1 kHz mono 16-bit, as delivered) with only silence added: a lead-in (the first word lands at 1.0 s, as the caret's second blink comes on), 1 s before "Keskustelijoina" (the script's [long pause], which the voice did not make) and a tail. It writes `audio/ep01/intro.wav`, `track.json` (where each chapter sits) and `intro.levels.json` (`pnpm launch levels`: the envelopes, onsets and phrases the orb and the cues use).

## How it is timed

No seconds by hand (`timing.ts`). The phrases in the levels file, read inside the chapters from `track.json`, give every cue: the first phrase is the birth; chapter 2's first three phrases are the names; chapter 4's phrases are the return and "Ei virheitä."; the whisper's phrase is the glitch. Words inside a phrase are placed by their syllables, close to the voice rather than exact.

## A new episode

Generate only the whispered line with Matilda, save it in `videos/no-mistakes/audio/intro/ep03/`, add `ep03` to `EPISODES` in `episodes.ts`, run `build.ts ep03`, and copy `videos/no-mistakes-intro-ep02/` to `-ep03` with its ids changed.
