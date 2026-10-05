// Corrections, glossary and sources for each episode, by episode number.
// Text may link inline as Markdown: [Axios](https://…). A source follows the fact it backs.
// Times are seconds into the episode, where the claim is said (as in the transcript).

export type Correction = { time: number; claim: string; body: string[] };

export type EpisodeNotes = {
  corrections: Correction[];
  /** Things that sound wrong but are not. */
  clarifications: Correction[];
  glossary: { term: string; text: string }[];
  sources: string[];
};

const L = {
  astra: "https://openai.com/index/gpt-6-astra/",
  arc: "https://arcprize.org/blog/astra",
  axios: "https://www.axios.com/2026/09/09/anthropic-researcher-ai-warning-interview",
  techcrunch: "https://techcrunch.com/2026/09/09/gambling-with-our-lives-anthropic-researcher-quits-warns-against-self-improving-ai/",
  npr: "https://www.npr.org/2026/09/10/nx-s1-5964864/former-anthropic-researcher-outlines-threat-of-ai-going-rogue",
  cnbc: "https://www.cnbc.com/2026/09/09/anthropic-researcher-quits-ai-safety.html",
  brockman: "https://ia.acs.org.au/article/2026/openai-says-the-agi-era-is-here-experts-disagree.html",
  huang: "https://thenextweb.com/news/jensen-huang-agi-has-arrived-gpt-6-astra",
  marcus: "https://garymarcus.substack.com/p/sad-to-see-jensen-huang-claim-that",
  nature: "https://www.nature.com/articles/s41586-024-07566-y",
  tokenizer: "https://platform.openai.com/tokenizer",
  tiktoken: "https://github.com/openai/tiktoken",
  zai: "https://en.wikipedia.org/wiki/Z.ai",
  qwen: "https://fi.wikipedia.org/wiki/Qwen",
  cerebras: "https://fi.wikipedia.org/wiki/Cerebras",
  opendesign: "https://open-design.ai/",
  openweights: "https://en.wikipedia.org/wiki/Open_weights",
  collapse: "https://fi.wikipedia.org/wiki/Malliromahdus",
};

export const NOTES: Record<number, EpisodeNotes> = {
  1: {
    corrections: [
      {
        time: 361,
        claim: "Varoituspuhe tekoälyn vaaroista on listautumista edeltävää arvopumppausta.",
        body: [
          `Mikon esimerkki on Jacob Coxon, joka irtisanoutui Anthropicilta 8.9.2026 ja varoitti yhtiöiden kilpajuoksusta kohti itseään parantavaa superälyä ([TechCrunch](${L.techcrunch}), [NPR](${L.npr})).`,
          `Hän lähti kaksi kuukautta ennen kuin hänen Anthropic-osakkeensa olisivat vapautuneet, ja sanoi, ettei hänellä ole enää mitään hyötyä yhtiön arvon nostamisesta. OpenAI:n osakkeet hänellä on yhä ([Axios](${L.axios})).`,
          `Anthropicin alignment-tutkimuksen vetäjä Evan Hubinger vastasi julkisesti ja arvioi yli kymmenen prosentin todennäköisyyttä sille, että tekoäly tappaa kaikki ihmiset seuraavan vuosikymmenen aikana ([CNBC](${L.cnbc})).`,
          "Hyötyvätkö yhtiöt pelottavasta puheesta, on tulkinta. Nämä ovat tiedossa olevat faktat.",
        ],
      },
      {
        time: 557,
        claim: "OpenAI kiersi sääntöjä rakentamalla AGI-benchmarkkiin oman harnessin.",
        body: [
          `Oma harness on totta, sääntöjen kiertäminen ei. Benchmarkin tekijä ARC Prize ajoi Astran kahdella tavalla ja julkaisi molemmat: Astra Max sai valmistajaneutraalilla Standard-harnessilla 62,7 %, Astra High mallin päättelytilan säilyttävällä Provider Adapter -harnessilla 99,9 %. Ne vastaavat eri kysymyksiin ([ARC Prize](${L.arc})).`,
          `OpenAI:n julkaisu nosti esiin 99,9 %:n luvun. Muut luvut pitävät: FrontierMath Tier 4 97,6 % ja ExploitBench 100 %. OpenAI:n omassa vertailussa Claude Fable 5.1 voittaa Astran Humanity's Last Examissa ja Artificial Analysis -indeksissä ([OpenAI](${L.astra})).`,
        ],
      },
      {
        time: 735,
        claim: "”Model implosion.”",
        body: [
          `Termi on model collapse: rappeutuminen, kun mallisukupolvia koulutetaan rekursiivisesti mallien tuottamalla datalla ja alkuperäisen datan jakauma katoaa ([Shumailov ym., Nature 2024](${L.nature})). Huolella valittu synteettinen data ei sinänsä ole ongelma.`,
          "Että Opus olisi rappeutunut Claude Coden datan takia, on hypoteesi, ei havainto. Huomio mallin kielen muuttumisesta on silti terävä. Nimi ja syy menivät pieleen.",
        ],
      },
      {
        time: 1054,
        claim: "Kiina on tokenitehokkaampi kieli, koska se on symbolinen.",
        body: [
          "Liian yksinkertaistettu, ja Joni pyytää tarkistusta itse samassa lauseessa. Kiinan merkki kantaa enemmän merkitystä kuin latinalainen kirjain, mutta se ei yksin ratkaise tokenien määrää.",
          `Omassa testissämme sama kiinankielinen lause vei GPT-3:n tokenizerilla (r50k_base) noin kaksi tokenia merkkiä kohti, GPT-4:n (cl100k_base) noin yhden ja GPT-4o:n (o200k_base) alle yhden ([tiktoken](${L.tiktoken})). Tehokkuus syntyy kielen, kirjoitusjärjestelmän ja tokenizerin yhteispelistä.`,
        ],
      },
      {
        time: 1164,
        claim: "Suomen ja englannin eron näkee vertaamalla sanoja jäätelöpuikko ja ice cream.",
        body: [
          "Vertailupari on väärä. Jäätelöpuikko on ice cream bar: yhdyssana kantaa yhden käsitteen enemmän, joten vertailu mittasi kahta eri asiaa, ei kahta kieltä.",
          `Oikea pari on jäätelö ja ice cream. GPT-4:n tokenizerilla (cl100k_base) ne ovat 5 ja 2 tokenia, GPT-4o:n (o200k_base) 4 ja 2. Ice cream on kaksi tokenia, ei kolme ([OpenAI Tokenizer](${L.tokenizer}), [tiktoken](${L.tiktoken})).`,
          "Pointti säilyy, mutta 2–2,5-kertainen ero koskee tätä yhtä sanaparia. Laajemmassa tekstissä ero on pienempi ja riippuu aineistosta.",
        ],
      },
      {
        time: 1244,
        claim: "Suomi kuluttaa 3,4 merkkiä per token, englanti 5,2.",
        body: [
          "Luvut luettiin ruudulta kielimallin vastauksesta, ei mitatusta lähteestä. Yleispätevää lukua ei ole: se riippuu tokenizerista, aineistosta ja siitä, mitä merkiksi lasketaan.",
          `Mittasimme tämän jakson litteroinnin: suomi on o200k_basella 3,5 merkkiä per token ja cl100k_basella 2,6 ([tiktoken](${L.tiktoken})). Suomen luku osui siis lähelle, mutta lähdettä sille ei ollut. Ilmiö on todellinen: suomi kuluttaa samaan sisältöön enemmän tokeneita, ja se näkyy hinnassa, viiveessä ja siinä, kuinka paljon kontekstiin mahtuu.`,
          "Minuuttia aiemmin jaksossa sanotaan ”joo joo, kyllä sokeesti voi luottaa, se on tekoäly” ja pyydetään bullshit-leimaa. Sitten luetaan mallin luvut ääneen faktana. Tässä ohjelma on parhaimmillaan.",
        ],
      },
    ],
    clarifications: [
      {
        time: 1204,
        claim: "Tokenizerin sanasto on kasvanut GPT-3:n 50 000:sta GPT-4o:n 200 000:een.",
        body: [
          `Pitää paikkansa. Sukupolvittain noin 50 000 (GPT-3, r50k_base), 100 000 (GPT-4, cl100k_base) ja 200 000 (GPT-4o, o200k_base) ([tiktoken](${L.tiktoken})). Valtteri nimeää GPT-4o:n samassa lauseessa, joten ensi kuulemalta virheeltä kuulostava kohta ei ole virhe.`,
        ],
      },
    ],
    glossary: [
      {
        term: "Harness",
        text: "Ohjelmisto, joka ajaa mallia: työkalut, kehotteet ja silmukka mallin ympärillä. Sama malli eri harnessissa käyttäytyy eri tavalla.",
      },
      {
        term: "Tokenizer",
        text: "Osa, joka pilkkoo tekstin malliin meneviksi paloiksi. OpenAI:n nykyisillä tokenizereilla suomi kuluttaa keskimäärin enemmän tokeneita kuin englanti vastaavaan sisältöön.",
      },
      {
        term: "Model collapse",
        text: `Suomeksi malliromahdus. Mallin rappeutuminen, kun mallisukupolvia koulutetaan rekursiivisesti mallien tuottamalla datalla niin, että alkuperäisen datan jakauma katoaa ([Wikipedia](${L.collapse})).`,
      },
      {
        term: "Vibe check",
        text: "Epävirallinen arvio siitä, miltä uusi malli tuntuu omassa työssä, vastakohtana benchmark-pisteille.",
      },
      {
        term: "Avoimet painot",
        text: `Malli, jonka parametrit on julkaistu. Sitä voi ajaa omalla tai vuokratulla raudalla, eikä tarvitse luottaa siihen, mitä rajapinnan takana tapahtuu ([Wikipedia](${L.openweights})).`,
      },
      {
        term: "Z.ai (ZAI)",
        text: `Kiinalainen tekoäly-yhtiö, aiemmin Zhipu AI. Sen GLM-kielimallit julkaistaan avoimin painoin, ja yhtiö listautui Hongkongin pörssiin tammikuussa 2026 ([Wikipedia](${L.zai})).`,
      },
      {
        term: "Qwen",
        text: `Alibaban kielimalliperhe, jota kehittää Alibaba Cloud. Malleja julkaistaan myös avoimin painoin, ja niitä voi ajaa omalla raudalla ([Wikipedia](${L.qwen})).`,
      },
      {
        term: "Cerebras",
        text: `Yhdysvaltalainen yhtiö, joka valmistaa poikkeuksellisen suuria tekoälypiirejä. Sen pilvipalvelussa kielimallit tuottavat tekstiä hyvin nopeasti ([Wikipedia](${L.cerebras})).`,
      },
      {
        term: "Open Design",
        text: `Avoimen lähdekoodin suunnittelutyötila, jossa oma koodausagentti, kuten Claude Code tai Codex, tekee prototyyppejä, sivuja ja dioja HTML:nä. Jaksossa sitä käytetään harnessina ([open-design.ai](${L.opendesign})).`,
      },
    ],
    sources: [
      `[GPT-6 Astra](${L.astra}), OpenAI. Esikatselu 3.9.2026, yleisesti saatavilla 4.9.2026`,
      `[OpenAI's GPT-6 Astra on ARC-AGI-3](${L.arc}), ARC Prize`,
      `[Greg Brockmanin AGI-kommentit](${L.brockman}), syyskuu 2026`,
      `[Jensen Huang: ”AGI has arrived”](${L.huang}), 6.9.2026`,
      `[Gary Marcusin vastine](${L.marcus}), 6.9.2026`,
      `Jacob Coxonin irtisanoutuminen: [TechCrunch](${L.techcrunch}), [NPR](${L.npr}), [CNBC](${L.cnbc}), [Axios](${L.axios}), 9.–10.9.2026`,
      `Shumailov ym., [”AI models collapse when trained on recursively generated data”](${L.nature}), Nature 2024`,
      `[OpenAI Tokenizer](${L.tokenizer}) (jäätelö / ice cream -testi)`,
      `[tiktoken](${L.tiktoken}): r50k_base, cl100k_base, o200k_base`,
    ],
  },
};

/** Text with inline Markdown links, as parts to render. */
export function inline(text: string): { text: string; href?: string }[] {
  const parts: { text: string; href?: string }[] = [];
  let last = 0;
  for (const m of text.matchAll(/\[([^\]]+)\]\(([^)\s]+)\)/g)) {
    if (m.index > last) parts.push({ text: text.slice(last, m.index) });
    parts.push({ text: m[1], href: m[2] });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}
