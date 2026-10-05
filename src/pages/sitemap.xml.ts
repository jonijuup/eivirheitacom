import { EPISODES, episodeUrl } from "../data/episodes.ts";
import { SITE } from "../data/site.ts";

export const GET = () => {
  const urls = ["/", ...EPISODES.map(episodeUrl)].map((p) => `  <url><loc>${new URL(p, SITE.url).href}</loc></url>`);
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`,
    { headers: { "Content-Type": "application/xml; charset=utf-8" } },
  );
};
