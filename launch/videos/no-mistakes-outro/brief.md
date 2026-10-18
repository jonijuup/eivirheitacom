# Ei virheitä: the outro

## Audience

Listeners of the Ei virheitä podcast, at the end of each episode. The bookend to the spoken intro (`videos/no-mistakes-intro`): the same tube, the same orb, the same voice.

## What it shows

- The clean logo, as the intro ends. The caret backspaces "Ei virheitä" away and melts into the orb as the voice starts.
- The orb listens to the voice, as in the intro.
- "…osoitteesta ei virheita piste com": `eivirheita.com` is typed under the orb as it is said, and stays.
- "Ensi kertaan!": the orb calms and shrinks back into the caret, the address rises to sit under the logo line, and the caret types "Ei virheitä" again. The end card is the logo over the address, caret blinking.

## Facts

The show's address, as the narration says it: eivirheita.com.

## Length, format

The narration plus about 2 s of end card (26.6 s), 1920×1080, 60 fps. The narration's loudness is as generated: not normalised.

## Sound

- `audio/outro-speech-finnish.wav`: generated with ElevenLabs, voice **Matilda** (as the intro). `audio/outro-speak-finnish.srt` is its script and segment times.
- `node videos/no-mistakes-outro/build.ts` places it sample for sample (44.1 kHz mono 16-bit, as delivered) after a lead-in (the first word at 2.0 s, after the logo has held a moment and been backspaced away) with a silent tail, and writes `audio/outro.wav`, `track.json` and `outro.levels.json`.

## How it is timed

From the phrases in the levels file (`timing.ts` lists them against the SRT): the first phrase is the birth, the fourth is the address, the last is the return. Words inside a phrase are placed by their syllables.
