// Plain-text versions of the site for agents and LLMs: each page as Markdown,
// llms.txt (https://llmstxt.org) and llms-full.txt. The HTML pages say the same.

import { EPISODES, type Episode, episodeLinks, episodeUrl, formatDate, minutes, mistakesLabel, pad } from "../data/episodes.ts";
import { ELSEWHERE, HOSTS, hostList, PLATFORMS, SITE } from "../data/site.ts";
import { timestamp, transcript } from "./transcript.ts";

const abs = (path: string) => new URL(path, SITE.url).href;
export const episodeMd = (e: Episode) => `/jaksot/${e.slug}.md`;

const listen = (e?: Episode) =>
  (e ? episodeLinks(e, PLATFORMS) : PLATFORMS)
    .map((p) => (p.href ? `- [${p.name}](${p.href})` : `- ${p.name}: tulossa`))
    .join("\n");

const facts = (e: Episode) =>
  [
    `- Jakso: ${pad(e.number)}`,
    e.date ? `- Julkaistu: ${formatDate(e.date)}` : null,
    e.recorded ? `- Nauhoitettu: ${formatDate(e.recorded)}` : null,
    `- Kesto: ${Math.floor(e.seconds / 60)}:${String(e.seconds % 60).padStart(2, "0")}`,
    `- Virheitä: ${e.mistakes}`,
    `- Keskustelijat: ${hostList()}`,
    `- Sivu: ${abs(episodeUrl(e))}`,
  ]
    .filter(Boolean)
    .join("\n");

export function indexMd() {
  return `# ${SITE.name}

> ${SITE.description}

${SITE.about.join("\n\n")}

## Keskustelijat

${HOSTS.map((h) => `- **${h.name}**: ${h.role} ([${h.company.name}](${h.company.href}), [LinkedIn](${h.linkedin}))`).join("\n")}

## Muualla

${ELSEWHERE.map((n) => `- [${n.name}](${n.href}): ${n.note}`).join("\n")}

## Jaksot

${EPISODES.map((e) => `- [${pad(e.number)} ${e.title}](${abs(episodeMd(e))}): ${e.description} (${minutes(e)} min, ${mistakesLabel(e.mistakes)})`).join("\n")}

## Kuuntele

${listen()}
`;
}

export function episodeMarkdown(e: Episode, { withTranscript = true } = {}) {
  const lines = e.transcript && withTranscript ? transcript(e.transcript) : [];
  return `# ${pad(e.number)} ${e.title}

> ${e.description}

${facts(e)}

## Aiheet

${e.topics.map((t) => `- ${t}`).join("\n")}

## Kuuntele

${listen(e)}
${
  lines.length
    ? `
## Litterointi

Konetekstitys, joten siinä on virheitä. Puhujia ei ole merkitty.

${lines.map((p) => `[${timestamp(p.start)}] ${p.text}`).join("\n\n")}
`
    : ""
}`;
}

export function llmsTxt() {
  return `# ${SITE.name}

> ${SITE.description}

Sivusto on suomeksi. Jokaisesta sivusta on Markdown-versio, linkitetty alla; jaksojen versioissa on koko litterointi.

## Sivusto

- [Etusivu](${abs("/index.md")}): esittely, keskustelijat, jaksot ja kuuntelulinkit

## Jaksot

${EPISODES.map((e) => `- [${pad(e.number)} ${e.title}](${abs(episodeMd(e))}): ${e.description}`).join("\n")}

## Optional

- [Kaikki yhdessä tiedostossa](${abs("/llms-full.txt")}): koko sivusto ja kaikki litteroinnit
`;
}

export function llmsFullTxt() {
  return [indexMd(), ...EPISODES.map((e) => episodeMarkdown(e))].join("\n---\n\n");
}

export const markdownResponse = (body: string, type = "text/markdown") =>
  new Response(body, { headers: { "Content-Type": `${type}; charset=utf-8` } });
