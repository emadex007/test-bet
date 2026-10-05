import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { getPortfolio } from "~/lib/api";
import { cn, useSite } from "~/lib/ui";
import { FeatureOff, ListingCard, PageHero, ProjectGrid } from "~/components/ui";
import { SearchIcon } from "~/components/Icons";
import { isUnavailable } from "~/lib/features";
import { pageTitleFor } from "~/lib/brand";
import type { ProjectSummary } from "~/server/db";

/** Filters live in the address bar, so a search can be shared or linked to (the home page search uses this). */
export type ListingSearch = { type?: string; ptype?: string; q?: string; beds?: number; max?: number; sort?: "new" | "low" | "high"; avail?: boolean };

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim().slice(0, 80) : undefined);
const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

export const Route = createFileRoute("/portfolio/")({
  validateSearch: (s: Record<string, unknown>): ListingSearch => ({
    type: str(s.type),
    ptype: str(s.ptype),
    q: str(s.q),
    beds: num(s.beds),
    max: num(s.max),
    sort: s.sort === "low" || s.sort === "high" ? s.sort : undefined,
    avail: s.avail === true || s.avail === "true" ? true : undefined,
  }),
  loader: () => getPortfolio(),
  head: () => ({ meta: [{ title: pageTitleFor("portfolioTitle") }] }),
  component: Portfolio,
});

function Portfolio() {
  const s = useSite();
  const projects = Route.useLoaderData();
  if (!s.features.portfolio) return <FeatureOff />;
  return (
    <>
      <PageHero eyebrow={s.labels.portfolioEyebrow} title={s.pages.portfolioTitle} intro={s.pages.portfolioIntro} image={s.pages.portfolioImage} />
      <section className="section">
        <div className="container-x">
          {s.features.listings ? <Listings items={projects} /> : <Gallery items={projects} />}
          <ClosingCta />
        </div>
      </section>
    </>
  );
}

/** Portfolio grid with category tabs (any industry). */
function Gallery({ items }: { items: ProjectSummary[] }) {
  const s = useSite();
  const categories = useMemo(() => ["All", ...new Set(items.map((p) => p.category).filter(Boolean))], [items]);
  const [cat, setCat] = useState("All");
  const shown = cat === "All" ? items : items.filter((p) => p.category === cat);
  return (
    <>
      {categories.length > 2 && (
        <div className="mb-10 flex flex-wrap gap-2" role="tablist" aria-label={`Filter ${s.labels.items.toLowerCase()}`}>
          {categories.map((c) => (
            <button key={c} role="tab" aria-selected={cat === c} data-on={cat === c} onClick={() => setCat(c)} className="chip">
              {c}
              {c !== "All" && <span className="ml-1.5 opacity-60">{items.filter((p) => p.category === c).length}</span>}
            </button>
          ))}
        </div>
      )}
      {shown.length === 0 ? (
        <p className="py-20 text-center text-muted">{s.labels.items} will appear here soon.</p>
      ) : (
        <ProjectGrid items={shown} feature />
      )}
    </>
  );
}

/** Property listings with filters: sale/rent, property type, bedrooms, max price, keyword, sort. */
function Listings({ items }: { items: ProjectSummary[] }) {
  const s = useSite();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [q, setQ] = useState(search.q ?? "");
  const set = (patch: Partial<ListingSearch>) => navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true, resetScroll: false });

  const types = useMemo(() => [...new Set([...s.listing.types, ...items.map((p) => p.listing_type)].filter(Boolean))], [items, s.listing.types]);
  const ptypes = useMemo(() => [...new Set(items.map((p) => p.category).filter(Boolean))].sort(), [items]);

  const shown = useMemo(() => {
    const words = (search.q ?? "").toLowerCase().split(/\s+/).filter(Boolean);
    const list = items.filter(
      (p) =>
        (!search.type || p.listing_type === search.type) &&
        (!search.ptype || p.category === search.ptype) &&
        (!search.beds || p.bedrooms >= search.beds) &&
        (!search.max || (p.price > 0 && p.price <= search.max)) &&
        (!search.avail || !isUnavailable(s, p.status)) &&
        words.every((w) => `${p.title} ${p.location} ${p.category} ${p.summary}`.toLowerCase().includes(w)),
    );
    if (search.sort === "low") return [...list].sort((a, b) => (a.price || Infinity) - (b.price || Infinity));
    if (search.sort === "high") return [...list].sort((a, b) => b.price - a.price);
    // Default: as ordered in the dashboard, with sold/let ones last.
    return [...list].sort((a, b) => Number(isUnavailable(s, a.status)) - Number(isUnavailable(s, b.status)));
  }, [items, search, s]);

  const active = !!(search.type || search.ptype || search.q || search.beds || search.max || search.avail);
  const sel = "h-11 w-full rounded-[var(--radius)] border border-line bg-surface px-3 text-sm outline-none focus:border-accent";

  return (
    <>
      {s.listing.showFilters && (
        <div className="mb-10 space-y-4">
          {types.length > 1 && (
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="For sale or rent">
              {["", ...types].map((t) => (
                <button key={t || "all"} role="tab" aria-selected={(search.type ?? "") === t} data-on={(search.type ?? "") === t} onClick={() => set({ type: t || undefined })} className="chip">
                  {t || "All"}
                  <span className="ml-1.5 opacity-60">{t ? items.filter((p) => p.listing_type === t).length : items.length}</span>
                </button>
              ))}
            </div>
          )}
          <div className="grid gap-3 rounded-[var(--radius)] border border-line bg-surface p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
            <form
              className="relative sm:col-span-2 lg:col-span-1"
              onSubmit={(e) => {
                e.preventDefault();
                set({ q: q.trim() || undefined });
              }}
            >
              <label htmlFor="l-q" className="sr-only">Search</label>
              <input id="l-q" value={q} onChange={(e) => setQ(e.target.value)} onBlur={() => set({ q: q.trim() || undefined })} placeholder="Area, estate or keyword" className={cn(sel, "pl-10")} />
              <SearchIcon size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            </form>
            <select aria-label="Property type" value={search.ptype ?? ""} onChange={(e) => set({ ptype: e.target.value || undefined })} className={sel}>
              <option value="">Any type</option>
              {ptypes.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <select aria-label="Bedrooms" value={search.beds ?? ""} onChange={(e) => set({ beds: Number(e.target.value) || undefined })} className={sel}>
              <option value="">Any bedrooms</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n}+ bedrooms</option>
              ))}
            </select>
            <select aria-label="Maximum price" value={search.max ?? ""} onChange={(e) => set({ max: Number(e.target.value) || undefined })} className={sel}>
              <option value="">Any price</option>
              {PRICE_STEPS.map((n) => (
                <option key={n} value={n}>Up to {s.listing.currency}{n >= 1e6 ? `${n / 1e6}M` : `${n / 1e3}k`}</option>
              ))}
            </select>
            <select aria-label="Sort" value={search.sort ?? "new"} onChange={(e) => set({ sort: e.target.value === "new" ? undefined : (e.target.value as "low" | "high") })} className={sel}>
              <option value="new">Newest first</option>
              <option value="low">Price: low to high</option>
              <option value="high">Price: high to low</option>
            </select>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <p className="text-muted">
              {shown.length} {shown.length === 1 ? s.labels.item.toLowerCase() : s.labels.items.toLowerCase()}
              {active && " match your search"}
            </p>
            <div className="flex items-center gap-4">
              <label className="flex cursor-pointer items-center gap-2">
                <input type="checkbox" checked={!!search.avail} onChange={(e) => set({ avail: e.target.checked || undefined })} className="h-4 w-4 accent-[var(--c-accent)]" />
                Available only
              </label>
              {active && (
                <button
                  onClick={() => {
                    setQ("");
                    navigate({ search: {}, replace: true, resetScroll: false });
                  }}
                  className="font-semibold underline-offset-2 hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {shown.length === 0 ? (
        <div className="rounded-[var(--radius)] border border-dashed border-line px-6 py-16 text-center">
          <p className="font-heading text-3xl">{items.length ? `No ${s.labels.items.toLowerCase()} match that search` : `${s.labels.items} will appear here soon`}</p>
          <p className="mx-auto mt-3 max-w-md text-muted">Tell us what you're looking for and we'll let you know when something comes up.</p>
          {s.features.quotes && <Link to="/quote" className="btn btn-primary mt-6">{s.labels.quoteCta}</Link>}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((p) => (
            <ListingCard key={p.id} p={p} />
          ))}
        </div>
      )}
    </>
  );
}

const PRICE_STEPS = [500e3, 1e6, 2e6, 5e6, 10e6, 20e6, 50e6, 100e6, 200e6, 500e6];

function ClosingCta() {
  const s = useSite();
  const { quotes, booking } = s.features;
  if (!quotes && !booking) return null;
  return (
    <div className="mt-20 flex flex-col items-center gap-5 border-t border-line pt-16 text-center">
      <h2 className="text-4xl">{s.features.listings ? "Didn't find the right one?" : "Like what you see?"}</h2>
      <p className="max-w-md text-muted">
        {s.features.listings
          ? "Tell us your budget and preferred area and we'll search for you, or book an inspection of any listing."
          : "Let's talk about what you need. Book a consultation or tell us about your project for a quote."}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        {quotes && <Link to="/quote" className="btn btn-primary">{s.labels.quoteCta}</Link>}
        {booking && <Link to="/book" className="btn btn-outline">{s.labels.bookCta}</Link>}
      </div>
    </div>
  );
}
