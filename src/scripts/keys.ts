// Function keys, as on a DOS screen: press the number in the bottom bar to go there.
// On the front page the bar also shows which section is on screen.

const links = [...document.querySelectorAll<HTMLAnchorElement>(".keys a[data-key]")];

document.addEventListener("keydown", (event) => {
  if (event.metaKey || event.ctrlKey || event.altKey || event.isComposing) return;
  const target = event.target as HTMLElement | null;
  if (target?.closest("input, textarea, select, [contenteditable]")) return;
  const link = links.find((a) => a.dataset.key === event.key);
  if (!link) return;
  event.preventDefault();
  link.click();
});

const here = (a: HTMLAnchorElement) => {
  const url = new URL(a.href);
  return url.pathname === location.pathname ? url.hash || "#top" : null;
};

const sections = links
  .map((a) => ({ a, hash: here(a) }))
  .filter((s): s is { a: HTMLAnchorElement; hash: string } => s.hash !== null)
  .map((s) => ({ ...s, el: s.hash === "#top" ? document.body.querySelector("main > :first-child") : document.querySelector(s.hash) }))
  .filter((s) => s.el);

if (sections.length) {
  const visible = new Map<Element, boolean>();
  const observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) visible.set(e.target, e.isIntersecting);
      // The last section that reaches the middle band of the screen is current.
      const current = [...sections].reverse().find((s) => visible.get(s.el as Element));
      if (!current) return;
      for (const s of sections) s.a.setAttribute("aria-current", String(s === current));
    },
    { rootMargin: "-45% 0px -45% 0px" },
  );
  for (const s of sections) observer.observe(s.el as Element);
}
