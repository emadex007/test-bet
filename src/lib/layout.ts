// Layout styles (Site settings → Layout). Saved values are checked here so an unknown value
// from the database always falls back to a working style.
import { PACK_HOME } from "~/lib/pack";
import { HOME_SECTIONS, type HomeSection, type SiteSettings } from "~/lib/site-defaults";

type L = SiteSettings["layout"];

const pick = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(v as T) ? (v as T) : fallback);

export const LAYOUT_OPTIONS = {
  feel: ["elegant", "bold", "modern", "playful", "minimal"],
  header: ["classic", "centered", "minimal", "bold"],
  hero: ["full", "split", "centered", "slider"],
  services: ["numbered", "cards", "icons", "rows"],
  cards: ["overlay", "below", "masonry"],
  testimonials: ["slider", "grid", "quote"],
  footer: ["full", "simple", "cta"],
} as const;

export function layoutOf(s: SiteSettings): L {
  const l = (s.layout ?? {}) as Partial<L>;
  return {
    homeDesign: l.homeDesign === "standard" ? "standard" : "industry",
    feel: pick(l.feel, LAYOUT_OPTIONS.feel, "modern"),
    header: pick(l.header, LAYOUT_OPTIONS.header, "classic"),
    hero: pick(l.hero, LAYOUT_OPTIONS.hero, "full"),
    services: pick(l.services, LAYOUT_OPTIONS.services, "numbered"),
    cards: pick(l.cards, LAYOUT_OPTIONS.cards, "overlay"),
    testimonials: pick(l.testimonials, LAYOUT_OPTIONS.testimonials, "slider"),
    footer: pick(l.footer, LAYOUT_OPTIONS.footer, "full"),
    homeOrder: homeOrder(l.homeOrder),
  };
}

/** The saved order, with unknown keys dropped and any missing sections added at the end. */
export function homeOrder(saved: unknown): HomeSection[] {
  const all = HOME_SECTIONS.map((x) => x.key);
  const list = Array.isArray(saved) ? (saved.filter((k) => all.includes(k as HomeSection)) as HomeSection[]) : [];
  const unique = [...new Set(list)];
  return [...unique, ...all.filter((k) => !unique.includes(k))];
}

/** True when the home page is the industry's own design (betting, crypto…) rather than the standard one. */
export const industryHome = (s: SiteSettings) => !!PACK_HOME && layoutOf(s).homeDesign === "industry";

/** Banner styles that sit behind a see-through header. Industry home pages always get a solid header. */
export const heroUnderHeader = (s: SiteSettings) => !industryHome(s) && ["full", "slider"].includes(layoutOf(s).hero);
