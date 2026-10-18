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
  // Episode 2
  googleEnergy: "https://cloud.google.com/blog/products/infrastructure/measuring-the-environmental-impact-of-ai-inference",
  epoch: "https://epoch.ai/gradient-updates/how-much-energy-does-chatgpt-use",
  gptLive: "https://openai.com/fi-FI/index/introducing-gpt-live-1-in-the-api/",
  siriDma: "https://www.apple.com/newsroom/2026/06/due-to-dma-siri-ai-delayed-in-eu-for-ios-27-and-ipados-27/",
  ios27: "https://www.macrumors.com/roundup/ios-27/",
  appIntents: "https://developer.apple.com/documentation/appintents",
  pcc: "https://security.apple.com/blog/private-cloud-compute/",
  aiAct: "https://artificialintelligenceact.eu/implementation-timeline/",
  dma: "https://digital-markets-act.ec.europa.eu/index_en",
  redFlagAct: "https://www.legislation.gov.uk/ukpga/Vict/28-29/83/contents/enacted",
  redFlag: "https://en.wikipedia.org/wiki/Red_flag_traffic_laws",
  locomotiveActs: "https://en.wikipedia.org/wiki/Locomotive_Acts",
  lvm: "https://lvm.fi/-/valtioneuvosto-antoi-asetusmuutoksen-ajoneuvoasetukseen-takseihin-vihreat-rekisterikilvet",
  yleTaxi: "https://yle.fi/a/74-20245666",
  maes: "https://doi.org/10.1145/176789.176792",
  lumiere: "https://arxiv.org/abs/1301.7385",
  drucker: "https://en.wikipedia.org/wiki/The_Landmarks_of_Tomorrow",
  accounting: "https://en.wikipedia.org/wiki/History_of_accounting",
  sapiens: "https://en.wikipedia.org/wiki/Homo_sapiens",
  beta: "https://en.wikipedia.org/wiki/Beta_distribution",
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
        ],
      },
    ],
    clarifications: [],
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
  2: {
    corrections: [
      {
        time: 135,
        claim: "Jokainen tekoälykysely kaataa puoli hehtaaria sademetsää.",
        body: [
          `Yksittäisen kyselyn energiankulutus on pieni. Google mittasi Gemini-sovelluksen tekstikehotteen mediaanikulutukseksi 0,24 wattituntia ([Google Cloud](${L.googleEnergy})), ja Epoch AI arvioi tavallisen ChatGPT-kyselyn vievän noin 0,3 wattituntia, saman verran kuin Googlen vanha arvio yhdestä hausta. Hyvin pitkä syöte nostaa luvun noin 40 wattituntiin ([Epoch AI](${L.epoch})). Hehtaareista ei puhuta missään skenaariossa.`,
          "Pointti säilyy, mutta se koskee eri tasoa. Alan yhteenlaskettu kulutus ja datakeskusten rakentamistahti ovat iso kysymys, yksittäinen kysely ei.",
        ],
      },
      {
        time: 725,
        claim: "Siriin on avattu rajapintoja, ja sen moottoria pystyisi säätämään.",
        body: [
          `Puolet pitää paikkansa. Sovellukset voivat tarjota toimintojaan Sirille App Intents -rajapinnalla ([Apple Developer](${L.appIntents})), ja uusi Siri AI käyttää sovellusten toimintoja työkaluina ([MacRumors](${L.ios27})).`,
          `Moottoria ei voi vaihtaa eikä säätää. Siri AI ajaa Applen Foundation Model -malleja, jotka Apple rakensi yhteistyössä Googlen kanssa Geminin teknologialla, laitteella ja Private Cloud Computessa ([MacRumors](${L.ios27})). Kehittäjä päättää, mitä Siri voi sovelluksessa tehdä, ei sitä, millä mallilla.`,
        ],
      },
      {
        time: 947,
        claim: "EU AI Act on syy siihen, ettei uusi Siri tule Eurooppaan.",
        body: [
          `Este on digimarkkinasäädös DMA, ei tekoälyasetus. Apple kertoo, että EU:n sääntelijät hylkäsivät kaikki sen ehdottamat ratkaisut, ja että Siri AI jää siksi pois iOS 27:stä, iPadOS 27:stä ja watchOS 27:stä EU:ssa. macOS 27 ja visionOS 27 saavat sen ([Apple Newsroom](${L.siriDma})).`,
          `AI Act on silti voimassa: korkean riskin järjestelmien velvoitteet alkavat soveltua joulukuussa 2027, mutta muu osa asetuksesta, kuten artiklan 50 läpinäkyvyysvelvoitteet, sovelletaan elokuusta 2026 ([AI Act -aikataulu](${L.aiAct})). Siriin se ei vain liity.`,
        ],
      },
      {
        time: 970,
        claim: "Ensimmäisten autojen edessä käveli ihminen punaisen lipun kanssa.",
        body: [
          `Laki on brittiläinen Locomotive Act 1865, lempinimeltään Red Flag Act. Se vaati kolmen hengen miehistön, josta yksi käveli vähintään 60 jaardia ajoneuvon edellä punainen lippu kädessä, ja rajoitti nopeuden kahteen mailiin tunnissa kaupungeissa ja neljään maanteillä ([lakiteksti](${L.redFlagAct}), [Wikipedia](${L.redFlag})).`,
          `Laki kirjoitettiin höyrykäyttöisille maantieajoneuvoille, kaksi vuosikymmentä ennen bensa-autoa. Lippuvaatimus poistui jo 1878, jolloin saattajan piti enää kävellä 20 jaardia edellä. Vuonna 1896 alle kolmen tonnin ajoneuvot vapautettiin saattajasta ja nopeusrajoituksista ([Wikipedia](${L.locomotiveActs})). Britannian ensimmäisten bensa-autojen edellä käveli siis saattaja, mutta ei lippua.`,
          "Pointti säilyy: sääntely vastasi uuteen teknologiaan hidastamalla sen kävelyvauhtiin.",
        ],
      },
    ],
    clarifications: [
      {
        time: 538,
        claim: "Käyttäjän toimien ennakointia mallinnettiin agenteissa jo kauan sitten todennäköisyyslaskennalla.",
        body: [
          `Pitää paikkansa, ja se oli aikanaan valtavirtaa. Pattie Maesin ryhmä MIT Media Labissa rakensi käyttäjältään oppivia käyttöliittymäagentteja 1990-luvun alussa ([Maes, CACM 1994](${L.maes})), ja Microsoftin Lumière-projekti päätteli bayesilaisella mallilla, mitä käyttäjä oli tekemässä ja mitä hän tarvitsi ([Horvitz ym., UAI 1998](${L.lumiere})).`,
          "Lumièren prototyypit olivat Office 97:n avustajan, Clippyn, pohjana. Sama idea kuin ambienteissa agenteissa, eri moottorilla.",
        ],
      },
      {
        time: 768,
        claim: "GPT Live 1 tuli ulos eilen tai edellispäivänä.",
        body: [
          `Käytännössä oikein. GPT-Live-1 tuli yleisesti saataville API:ssa 10.9.2026, eli kolme päivää ennen nauhoitusta ([OpenAI](${L.gptLive})).`,
          "Malli kuuntelee ja puhuu yhtä aikaa, ja se voi delegoida raskaamman päättelyn taustalla toiselle mallille kesken keskustelun. Äänikerros maksaa 0,05 dollaria minuutilta, ja käytetty päättelymalli laskutetaan erikseen.",
        ],
      },
      {
        time: 837,
        claim: "Applen mallit ovat Google-pohjaisia, ja isot mallit pyörivät pilvessä.",
        body: [
          `Kuvaus on oikea. Siri AI ajaa Applen Foundation Model -malleja, jotka Apple rakensi yhteistyössä Googlen kanssa Geminin teknologialla. Pyynnöt käsitellään laitteella tai Applen Private Cloud Computessa, ja Apple on laajentamassa Apple Intelligencen ajoa myös Google Cloudiin ([MacRumors](${L.ios27})).`,
          "Jaksossa palvelu mainitaan nimellä ”Private Cloud”. Oikea nimi on Private Cloud Compute.",
        ],
      },
      {
        time: 1002,
        claim: "Suomeen on tulossa vihreät rekisterikilvet takseihin.",
        body: [
          `Totta, ja uutinen oli nauhoitushetkellä kolme päivää vanha. Valtioneuvosto antoi asetusmuutoksen 10.9.2026: taksien rekisterikilpien pohja muuttuu vihreäksi ja tunnus on musta ([LVM](${L.lvm})).`,
          `Muutos tulee voimaan 1.1.2027, ja vihreät kilvet ovat takseissa pakollisia 1.7.2027 ([Yle](${L.yleTaxi})).`,
        ],
      },
      {
        time: 1095,
        claim: "Tietotyö on ihmiskunnan historiassa uusi ilmiö.",
        body: [
          `Pitää paikkansa, kun mittakaavana on koko ihmiskunnan historia. Nykyihminen on ollut olemassa noin 300 000 vuotta ([Wikipedia](${L.sapiens})). Vanhimmat kirjanpitomerkinnät Mesopotamiasta ovat yli 7 000 vuotta vanhoja ([Wikipedia](${L.accounting})), ja käsite knowledge worker on peräisin Peter Druckerin kirjasta The Landmarks of Tomorrow vuodelta 1959 ([Wikipedia](${L.drucker})).`,
          "Jos nykyihmisen historia olisi yksi vuorokausi, kirjanpito olisi alkanut noin puoli tuntia sitten ja tietokoneen ääressä tehtävä tietotyö, johon jakso itse tarkentaa, vasta viimeisten 20 sekunnin aikana.",
        ],
      },
    ],
    glossary: [
      {
        term: "Ambientti agentti",
        text: "Agentti, jota ei käynnistetä kehotteella, vaan se reagoi itse johonkin tapahtumaan tai datavirtaan. Useimmat nykyiset agentit ovat joko ajastettuja tai käsin käynnistettyjä.",
      },
      {
        term: "App Intents",
        text: `Applen rajapinta, jolla sovellus kuvaa toimintonsa järjestelmälle, jolloin Siri ja Pikakomennot voivat käyttää niitä ([Apple Developer](${L.appIntents})).`,
      },
      {
        term: "Beta-jakauma",
        text: `Todennäköisyysjakauma välillä 0–1, jolla mallinnetaan epävarmuutta jostakin osuudesta tai todennäköisyydestä, esimerkiksi siitä, kuinka todennäköisesti käyttäjä tekee jotain tiettyyn aikaan ([Wikipedia](${L.beta})).`,
      },
      {
        term: "DMA",
        text: `EU:n digimarkkinasäädös, joka velvoittaa suuret alustayhtiöt avaamaan järjestelmiään kilpailijoille. Eri säädös kuin tekoälyasetus AI Act ([Euroopan komissio](${L.dma})).`,
      },
      {
        term: "Full-duplex",
        text: `Puhemalli kuuntelee ja puhuu yhtä aikaa, kuten ihminen puhelimessa, eikä odota vuoroaan. GPT-Live on tällainen malli ([OpenAI](${L.gptLive})).`,
      },
      {
        term: "Private Cloud Compute",
        text: `Applen oma palvelinympäristö niille Apple Intelligence -pyynnöille, jotka eivät mahdu laitteelle. Applen mukaan dataa ei säilytetä vastauksen jälkeen eikä se ole Applen saatavilla, ja ulkopuoliset tutkijat voivat tarkastaa järjestelmän ([Apple Security Research](${L.pcc})).`,
      },
    ],
    sources: [
      `[How much energy does Google's AI use? We did the math](${L.googleEnergy}), Google Cloud, 21.8.2025`,
      `[How much energy does ChatGPT use?](${L.epoch}), Epoch AI, 7.2.2025`,
      `[GPT-Live-1 in the API](${L.gptLive}), OpenAI, 10.9.2026`,
      `[Due to DMA, Siri AI delayed in EU for iOS 27 and iPadOS 27](${L.siriDma}), Apple Newsroom, kesäkuu 2026`,
      `[iOS 27: Everything We Know](${L.ios27}), MacRumors`,
      `[App Intents](${L.appIntents}), Apple Developer`,
      `[Private Cloud Compute](${L.pcc}), Apple Security Research`,
      `[EU AI Act -aikataulu](${L.aiAct})`,
      `[Digital Markets Act](${L.dma}), Euroopan komissio`,
      `[Locomotive Act 1865](${L.redFlagAct}), legislation.gov.uk; [Red flag traffic laws](${L.redFlag}) ja [Locomotive Acts](${L.locomotiveActs}), Wikipedia`,
      `Taksien vihreät rekisterikilvet: [LVM](${L.lvm}), 10.9.2026, ja [Yle](${L.yleTaxi})`,
      `Maes, [”Agents that reduce work and information overload”](${L.maes}), Communications of the ACM 37(7), 1994`,
      `Horvitz ym., [”The Lumière Project: Bayesian User Modeling for Inferring the Goals and Needs of Software Users”](${L.lumiere}), UAI 1998`,
      `[Homo sapiens](${L.sapiens}), [History of accounting](${L.accounting}) ja [The Landmarks of Tomorrow](${L.drucker}), Wikipedia`,
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
