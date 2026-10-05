import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://eivirheita.com",
  trailingSlash: "ignore",
  build: { format: "directory" },
});
