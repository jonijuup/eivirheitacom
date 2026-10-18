import { defineVideo, tempo } from "@intentface-launch/core";
import { Crt } from "./crt";
import { BEATS, FPS, LENGTH } from "./script.ts";

// Digital Dawn is 120 BPM. The typing starts on its beats (script.ts).
const t = tempo(120, FPS);

export default defineVideo({
  id: "no-mistakes",
  title: "Ei virheitä",
  logline:
    "Podcast intro: a caret on a CRT types the show's name, gets it wrong twice, and lands the full stop on the hit.",
  bpm: t.bpm,
  background: "#000000",
  audio: { src: "/videos/no-mistakes/audio/mix/no-mistakes.wav" },
  shots: [
    {
      id: "screen",
      title: "Ei virheitä podcast.",
      duration: Math.round(LENGTH * FPS),
      component: Crt,
      says: "A show about mistakes that cannot spell its own name, and gets there anyway.",
      copy: ["Ei virheitä podcast."],
      camera: "Locked on the screen, pushing in 6% over the whole intro.",
      sound: `Digital Dawn from the top; a keystroke on every key (mix.ts). The full stop on the hit at ${BEATS.stop.toFixed(2)} s.`,
      notes:
        "Fade in from black, caret blinks on the beat. Ei vireitä, then Ei vireihtä, then Ei virheitä, then Ei virheitä podcats, then Ei virheitä podcast. Fade to black with the track's tail.",
      board: [0.12, 0.25, 0.33, 0.43, 0.6, 0.72, 0.9],
    },
  ],
});
