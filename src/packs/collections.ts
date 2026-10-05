// Industry features ("collections"): lists of things a business manages in its dashboard and shows on its
// site, such as matches and odds, casino games, coins, menu items, causes or doctors.
// A pack lists its collections; the dashboard builds a page for each one automatically (/admin/c/<kind>).

export type FieldType = "text" | "textarea" | "number" | "image" | "select" | "toggle" | "datetime" | "url";

export type FieldDef = {
  k: string;
  label: string;
  type: FieldType;
  options?: string[]; // for select
  hint?: string;
  placeholder?: string;
  wide?: boolean;
  step?: number;
};

export type CollectionDef = {
  kind: string; // stored in items.kind, used in the dashboard address
  label: string; // dashboard menu and page title, e.g. "Matches & odds"
  one: string; // one item, e.g. "Match"
  description: string;
  titleLabel?: string; // label for the title field (default "Title")
  group?: { label: string; options?: string[] }; // category field (items.grp)
  image?: boolean; // show the photo field
  featuredLabel?: string; // show a "featured" switch with this label
  fields: FieldDef[];
  /** Short line under each item in the dashboard list, using {field} placeholders. */
  summary?: string;
};

/** An item as the site and dashboard use it. */
export type Item = {
  id: number;
  kind: string;
  title: string;
  grp: string;
  image: string;
  featured: number;
  active: number;
  sort_order: number;
  data: Record<string, string | number | boolean>;
};

/** Read a field from an item's data with a fallback. */
export const field = <T extends string | number | boolean>(i: Item, k: string, fallback: T): T => {
  const v = i.data?.[k];
  if (v === undefined || v === null || v === "") return fallback;
  if (typeof fallback === "number") {
    const n = Number(v);
    return (Number.isFinite(n) ? n : fallback) as T;
  }
  if (typeof fallback === "boolean") return (v === true || v === 1 || v === "1" || v === "true") as T;
  return String(v) as T;
};

/** Dashboard pages that come with every site, and can be hidden or renamed per industry. */
export type CorePage = "inbox" | "chat" | "quotes" | "projects" | "services" | "testimonials" | "clients" | "faqs";
