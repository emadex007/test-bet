// The business name and page titles used in browser-tab titles. Set from the dashboard settings when the
// site loads, so page titles never need the client's name or industry words hard-coded.
import { SITE_DEFAULTS, type SiteSettings } from "~/lib/site-defaults";

let brandName = SITE_DEFAULTS.brand.name;
let pages: SiteSettings["pages"] = SITE_DEFAULTS.pages;

export function setBrandName(name: string | undefined) {
  if (name) brandName = name;
}

/** Called by the root route with the saved settings. */
export function setSiteMeta(s: SiteSettings) {
  setBrandName(s.brand.name);
  pages = s.pages;
}

/** "Contact Us" → "Contact Us | <Business name>" */
export const pageTitle = (page: string) => `${page} | ${brandName}`;

/** A page title from Site settings → Other pages, e.g. pageTitleFor("bookTitle"). */
export const pageTitleFor = (key: "portfolioTitle" | "servicesTitle" | "bookTitle" | "quoteTitle" | "contactTitle") => pageTitle(pages[key]);
