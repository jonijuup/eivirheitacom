import { SITE } from "../data/site.ts";

// Everyone is welcome, agents included. The plain-text versions are in llms.txt.
export const GET = () =>
  new Response(`User-agent: *\nAllow: /\nDisallow: /dither/\n\nSitemap: ${SITE.url}/sitemap.xml\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
