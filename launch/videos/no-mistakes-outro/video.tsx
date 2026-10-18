import { defineVideo } from "@intentface-launch/core";
import { Tube } from "../no-mistakes-intro/tube";
import levels from "./audio/outro.levels.json";
import track from "./audio/track.json";
import { outroCues, URL } from "./timing.ts";

// The outro: the intro's tube and orb (videos/no-mistakes-intro), the same voice.
// Rebuild the audio with `node videos/no-mistakes-outro/build.ts`.

const FPS = 60;
const cues = outroCues(track, levels as never);
const duration = Math.round(cues.end * FPS);
const url = cues.under.keys;

export default defineVideo({
  id: "no-mistakes-outro",
  title: "Ei virheitä, outro",
  logline:
    "Podcast outro: the logo's caret becomes the orb again, thanks the listener, types the show's address, and goes back into the logo.",
  fps: FPS,
  background: "#000000",
  // The narration as generated: no normalising or limiting (build.ts adds only silence).
  audio: { src: "/videos/no-mistakes-outro/audio/outro.wav", loudness: "as-delivered" },
  shots: [
    {
      id: "outro",
      title: "Ensi kertaan!",
      duration,
      component: () => <Tube cues={cues} levels={levels as never} />,
      says: "Thanks for listening; every episode is at eivirheita.com; see you next time.",
      copy: [URL, "Ei virheitä"],
      camera: "Locked on the screen, pushing in 5% over the whole outro.",
      sound: "The narration (ElevenLabs, Matilda), as generated.",
      notes:
        "Opens on the clean logo, as the intro ends. The caret backspaces it away and melts into the orb as the voice starts. eivirheita.com is typed under the orb as it is said and stays. On 'Ensi kertaan!' the orb shrinks back into the caret, the address rises under the logo line, and the caret types 'Ei virheitä' again: the end card is the logo over the address.",
      // Storyboard stills: the logo, the orb, the address typed, the return, the end card.
      board: [0, cues.birth + 2, url[url.length - 1].at + 0.3, (cues.back[0] + cues.back[1]) / 2, cues.end - 0.05].map(
        (t) => Math.min(1, (t * FPS) / duration),
      ),
    },
  ],
});
