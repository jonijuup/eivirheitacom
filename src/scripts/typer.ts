// The logo, typed as in the intro: "Ei vireitä", then "Ei vireihtä", then
// right at last, "Ei virheitä". The page is served with the final text; this
// only replays it. Each new glyph flares as it lands, and the caret holds
// solid while typing and blinks once the line rests.

type Key = { kind: "char"; char: string } | { kind: "back" | "left" | "right" };

const typed = (text: string): Key[] => [...text].map((char) => ({ kind: "char", char }));
const repeat = (kind: "back" | "left" | "right", n: number): Key[] => Array.from({ length: n }, () => ({ kind }));

/** The keys, in groups; a group is typed at a steady pace, with a pause after it. */
const SCRIPT: { keys: Key[]; pause: number }[] = [
  { keys: typed("Ei vireitä"), pause: 0.7 },
  { keys: [...repeat("left", 2), ...typed("h")], pause: 0.55 },
  { keys: [...repeat("back", 1), ...repeat("left", 2), ...typed("h")], pause: 0.35 },
  { keys: repeat("right", 4), pause: 0 },
];

/** Seeded, so the human timing is the same on every visit. */
let seed = 20260927;
const rng = () => {
  seed = (seed + 0x6d2b79f5) >>> 0;
  let x = Math.imul(seed ^ (seed >>> 15), seed | 1);
  x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
  return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
};
const jitter = (base: number, amount: number) => base * (1 + (rng() * 2 - 1) * amount);
const wait = (s: number) => new Promise((r) => setTimeout(r, s * 1000));

function render(el: HTMLElement, chars: string[], caret: number, fresh: number | null) {
  const glyph = (c: string, i: number) => {
    const span = document.createElement("span");
    span.textContent = c;
    // The space is where a phone breaks the logo onto two lines (see .sp in index.astro).
    span.className = [c === " " ? "sp" : "", i === fresh ? "strike" : ""].join(" ").trim();
    return span;
  };
  const cursor = document.createElement("span");
  cursor.className = "caret";
  el.replaceChildren(
    ...chars.slice(0, caret).map(glyph),
    cursor,
    ...chars.slice(caret).map((c, i) => glyph(c, i + caret)),
  );
}

async function play(el: HTMLElement) {
  const chars: string[] = [];
  let caret = 0;
  el.classList.add("is-typing");
  render(el, chars, caret, null);
  document.documentElement.classList.remove("typer-pending");
  // Two blinks of the caret before the first key.
  el.classList.remove("is-typing");
  await wait(1.4);
  el.classList.add("is-typing");
  for (const group of SCRIPT) {
    for (const [i, key] of group.keys.entries()) {
      let fresh: number | null = null;
      if (key.kind === "char") {
        chars.splice(caret, 0, key.char);
        fresh = caret;
        caret++;
      } else if (key.kind === "back" && caret > 0) {
        chars.splice(--caret, 1);
      } else if (key.kind === "left") {
        caret = Math.max(0, caret - 1);
      } else if (key.kind === "right") {
        caret = Math.min(chars.length, caret + 1);
      }
      render(el, chars, caret, fresh);
      const next = group.keys[i + 1];
      const spaced = key.kind === "char" && (key.char === " " || (next?.kind === "char" && next.char === " "));
      await wait(key.kind === "char" ? jitter(spaced ? 0.15 : 0.1, 0.3) : jitter(0.12, 0.15));
    }
    await wait(group.pause);
  }
  el.classList.remove("is-typing");
}

const el = document.querySelector<HTMLElement>("[data-typer]");
if (el && document.documentElement.classList.contains("typer-pending")) play(el);
