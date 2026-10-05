// Feature switches (Site settings → Features) and the pages they control.
import type { SiteSettings } from "~/lib/site-defaults";

export type FeatureKey = keyof SiteSettings["features"];

const PAGE_FEATURES: [string, FeatureKey][] = [
  ["/services", "services"],
  ["/portfolio", "portfolio"],
  ["/book", "booking"],
  ["/quote", "quotes"],
];

/** Which feature a link belongs to, e.g. "/book?service=x" → "booking". */
export function featureOfPath(to: string): FeatureKey | null {
  const path = to.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  for (const [prefix, key] of PAGE_FEATURES) {
    if (path === prefix || path.startsWith(prefix + "/")) return key;
  }
  return null;
}

/** False when a link points at a page that has been switched off. External links are always on. */
export function pathOn(s: SiteSettings, to: string): boolean {
  const f = featureOfPath(to);
  return !f || s.features[f] !== false;
}

export function visibleLinks<T extends { to: string }>(s: SiteSettings, links: T[]): T[] {
  return links.filter((l) => pathOn(s, l.to));
}

/** The pages that are switched on, for the sitemap. */
export function enabledPages(s: SiteSettings): string[] {
  return ["/", "/about", "/services", "/portfolio", "/book", "/quote", "/contact"].filter((p) => pathOn(s, p));
}

// ---------- property listings ----------

/** ₦45,000,000 */
export function formatPrice(currency: string, price: number): string {
  if (!price || !Number.isFinite(price)) return "Price on request";
  return `${currency}${Math.round(price).toLocaleString("en-NG")}`;
}

/** ₦45M, ₦3.5M, ₦850k: for cards and badges. */
export function shortPrice(currency: string, price: number): string {
  if (!price || !Number.isFinite(price)) return "Price on request";
  const fmt = (n: number, unit: string) => `${currency}${Number(n.toFixed(n < 10 ? 1 : 0)).toLocaleString("en-NG")}${unit}`;
  if (price >= 1e9) return fmt(price / 1e9, "B");
  if (price >= 1e6) return fmt(price / 1e6, "M");
  if (price >= 1e3) return fmt(price / 1e3, "k");
  return `${currency}${price}`;
}

/** The first status in the list ("Available") counts as available; anything else gets a ribbon. */
export function isUnavailable(s: SiteSettings, status: string): boolean {
  return !!status && status !== (s.listing.statuses[0] ?? "Available");
}

export const amenityList = (text: string) =>
  text
    .split(/\n|,/)
    .map((x) => x.trim())
    .filter(Boolean);

/** The request-form questions as the dashboard should label them, e.g. "I want to" instead of "Project type". */
export function requestLabels(s: SiteSettings) {
  const q = s.forms;
  return {
    type: q.typeLabel || "Type",
    multi: q.multiLabel || "Options",
    style: q.styleLabel || "Style",
    size: q.sizeLabel || "Size",
    location: q.locationLabel || "Location",
    budget: q.budgetLabel || "Budget",
    timeline: q.timelineLabel || "Timeline",
    details: q.detailsLabel || "Details",
  };
}
