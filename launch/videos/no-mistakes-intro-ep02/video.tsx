import levels from "../no-mistakes-intro/audio/ep02/intro.levels.json";
import track from "../no-mistakes-intro/audio/ep02/track.json";
import { EPISODES } from "../no-mistakes-intro/episodes.ts";
import { defineIntro } from "../no-mistakes-intro/intro";

// Episode 2: the same intro with its own whispered count (videos/no-mistakes-intro).
// Rebuild the audio with `node videos/no-mistakes-intro/build.ts ep02`.
export default defineIntro("no-mistakes-intro-ep02", EPISODES.ep02, track, levels as never);
