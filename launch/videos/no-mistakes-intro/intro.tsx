import { defineVideo, type Levels } from "@intentface-launch/core";
import { type Episode, type Track, whispered } from "./episodes.ts";
import { cues } from "./timing.ts";
import { Tube } from "./tube";

const FPS = 60;

/** One episode's intro: the same picture, timed by that episode's track. */
export function defineIntro(id: string, episode: Episode, track: Track, levels: Levels) {
  const c = cues(track, levels, whispered(episode));
  const duration = Math.round(c.end * FPS);
  const Scene = () => <Tube cues={c} levels={levels} />;
  return defineVideo({
    id,
    title: `Ei virheitä, intro ${episode.id}`,
    logline:
      "Podcast intro: the logo's caret melts into an orb that listens to the host, then types the show's name, and glitches while the episode's mistakes are whispered.",
    fps: FPS,
    background: "#000000",
    // The narration is used as generated: no normalising or limiting (build.ts adds only silence).
    audio: { src: `/videos/no-mistakes-intro/audio/${episode.id}/intro.wav`, loudness: "as-delivered" },
    shots: [
      {
        id: "intro",
        title: "Ei virheitä",
        duration,
        component: Scene,
        says: "A calm voice welcomes you to Ei virheitä, names its three hosts, and admits to this episode's mistakes.",
        copy: ["Mikko Harju", "Valtteri Karesto", "Joni Juup", "Ei virheitä"],
        camera: "Locked on the screen, pushing in 5% over the whole intro.",
        sound: `The narration (ElevenLabs, Matilda); the whispered count is this episode's own (${episode.count}).`,
        notes:
          "A blinking caret melts into a white orb as the voice starts; the orb breathes and moves with the voice, colour only in its fringes. Each host's name is typed under it as it is said and backspaced for the next. At 'Ja nyt' the orb calms and shrinks back into the caret, which types 'Ei virheitä' with the voice. The whisper glitches the logo (split, torn lines, a jumping caret), hardest on the count, then it holds clean.",
        // Storyboard stills: the caret, the orb, each name, the return, the logo, the whisper's peak, the hold.
        board: [
          0,
          c.birth + 3,
          c.under.keys[6].at,
          c.under.keys.filter((k) => k.kind === "char")[16].at,
          c.under.keys.filter((k) => k.kind === "char")[28].at,
          (c.back[0] + c.back[1]) / 2,
          c.logo[c.logo.length - 1].at + 0.2,
          c.glitch ? (c.glitch.peak[0] + c.glitch.peak[1]) / 2 : c.end - 1,
          c.end - 0.05,
        ].map((t) => Math.min(1, (t * FPS) / duration)),
      },
    ],
  });
}
