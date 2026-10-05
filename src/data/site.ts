// The show: everything the pages, the Markdown versions and llms.txt say about it.

export const SITE = {
  name: "Ei virheitä",
  url: "https://eivirheita.com",
  lang: "fi",
  tagline: "Podcast tekoälystä ja teknologiasta.",
  description:
    "Ei virheitä on suomenkielinen podcast tekoälystä ja teknologiasta. Keskustelijoina Mikko Harju, Valtteri Karesto ja Joni Juup.",
  about: [
    "Ei virheitä on podcast tekoälystä ja teknologiasta. Kaikkia kolmea keskustelijaa yhdistää pitkä historia teknologian parissa, ja se, että he käyttävät uutta teknologiaa joka päivä, niin omassa työssään kuin vapaa-ajallaan.",
  ],
};

/** Where to listen. A link left as null is shown as coming soon. */
export const PLATFORMS: { id: string; name: string; href: string | null }[] = [
  { id: "spotify", name: "Spotify", href: "https://open.spotify.com/show/1s1kKHiFm5cmSLzWCLUWpo" },
  { id: "apple", name: "Apple Podcasts", href: "https://podcasts.apple.com/us/podcast/ei-virheit%C3%A4-podcast/id6819228625" },
  { id: "youtube", name: "YouTube", href: "https://www.youtube.com/@eivirheita" },
  { id: "rss", name: "RSS", href: "https://api.riverside.com/hosting/KqBdd6O9.rss" },
];

export type Company = { id: string; name: string; href: string };

export const COMPANIES = {
  taiste: { id: "taiste", name: "Taiste", href: "https://www.taiste.fi/fi" },
  intentface: { id: "intentface", name: "Intentface", href: "https://www.intentface.com/" },
} satisfies Record<string, Company>;

/** Side notes: where else to find the hosts' work. */
export const ELSEWHERE: { name: string; note: string; href: string }[] = [
  { name: "Intentface", note: "Valtteri ja Joni", href: COMPANIES.intentface.href },
  { name: "Intentfacen podcast", note: "Podcast", href: "https://www.intentface.com/podcast" },
  { name: "Taiste", note: "Mikko", href: COMPANIES.taiste.href },
  { name: "Taisteen videot", note: "YouTube-kanava", href: "https://www.youtube.com/@wearetaiste/videos" },
];

export type Host = { id: string; name: string; role: string; company: Company; linkedin: string; portrait: string };

/** In the order the intro introduces them. Portraits are cut from episode 1's artwork by scripts/dither.mjs. */
export const HOSTS: Host[] = [
  {
    id: "mikko",
    name: "Mikko Harju",
    role: "Taisteen teknologiajohtaja ja perustaja",
    company: COMPANIES.taiste,
    linkedin: "https://www.linkedin.com/in/mikko-harju-47462713/",
    portrait: "/media/hosts/mikko.png",
  },
  {
    id: "valtteri",
    name: "Valtteri Karesto",
    role: "Intentfacen perustaja ja teknologiajohtaja",
    company: COMPANIES.intentface,
    linkedin: "https://www.linkedin.com/in/valtterikaresto/",
    portrait: "/media/hosts/valtteri.png",
  },
  {
    id: "joni",
    name: "Joni Juup",
    role: "Intentfacen perustaja ja suunnittelujohtaja",
    company: COMPANIES.intentface,
    linkedin: "https://www.linkedin.com/in/jonim/",
    portrait: "/media/hosts/joni.png",
  },
];

export const hostList = () => {
  const names = HOSTS.map((h) => h.name);
  return `${names.slice(0, -1).join(", ")} ja ${names.at(-1)}`;
};
