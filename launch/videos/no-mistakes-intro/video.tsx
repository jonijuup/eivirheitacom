import levels from "./audio/ep01/intro.levels.json";
import track from "./audio/ep01/track.json";
import { EPISODES } from "./episodes.ts";
import { defineIntro } from "./intro";

// Episode 1. The code for every episode lives here; videos/no-mistakes-intro-ep02 reuses it.
// Rebuild the audio with `node videos/no-mistakes-intro/build.ts ep01`.
export default defineIntro("no-mistakes-intro", EPISODES.ep01, track, levels as never);
