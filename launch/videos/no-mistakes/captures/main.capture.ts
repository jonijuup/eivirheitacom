import { defineCapture } from "@intentface-launch/core/capture";

export default defineCapture({
  url: "http://localhost:3000/",
  viewport: { width: 1440, height: 900 },
  scale: 2,
  async setup(page) {
    await page.waitForLoadState("networkidle");
  },
  async run(c) {
    await c.hold(60);
  },
});
