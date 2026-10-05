// Betting industry home page: a sportsbook-style site with promotions, a sports bar, live and upcoming
// matches with odds, a bet slip, and a games lobby. Matches, odds, games and promotions are managed in the
// dashboard. In demo mode visitors bet with fake money; in link mode the slip sends them to the real platform.
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { cn, img, useSite, waLink } from "~/lib/ui";
import { field, type Item } from "~/packs/collections";
import { FaqList } from "~/components/FaqList";
import { ArrowLeft, ArrowRight, CloseIcon } from "~/components/Icons";
import type { HomeData } from "./types";
import { code, money, useDemoWallet } from "./demo";

type Market = "1x2" | "ou";
type Pick = { id: string; matchId: number; match: string; market: string; pick: string; odds: number };
type Ticket = { code: string; picks: Pick[]; stake: number; odds: number; at: number };

// ---------- kick-off times: "2026-10-12 19:00", "today 19:00", "tomorrow 15:30" ----------

function kickoff(raw: string): Date | null {
  const v = raw.trim().toLowerCase();
  const rel = v.match(/^(today|tomorrow|\+(\d+)d?)\s+(\d{1,2}):(\d{2})$/);
  if (rel) {
    const d = new Date();
    const add = rel[1] === "today" ? 0 : rel[1] === "tomorrow" ? 1 : Number(rel[2]);
    d.setDate(d.getDate() + add);
    d.setHours(Number(rel[3]), Number(rel[4]), 0, 0);
    return d;
  }
  const d = new Date(raw.replace(" ", "T"));
  return Number.isNaN(d.getTime()) ? null : d;
}
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
function when(raw: string) {
  const d = kickoff(raw);
  if (!d) return { day: raw || "TBC", time: "" };
  const now = new Date();
  const tmr = new Date(now);
  tmr.setDate(now.getDate() + 1);
  const day = sameDay(d, now) ? "Today" : sameDay(d, tmr) ? "Tomorrow" : d.toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short" });
  return { day, time: d.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", hour12: false }) };
}

// ---------- page ----------

export function BettingHome({ data }: { data: HomeData }) {
  const s = useSite();
  const p = s.platform;
  const demo = p.mode !== "link";
  const matches = data.items.match ?? [];
  const games = data.items.game ?? [];
  const promos = data.items.promo ?? [];

  const { wallet, save, reset } = useDemoWallet<{ tickets: Ticket[] }>(Number(p.demoBalance) || 50000, { tickets: [] });
  const [slip, setSlip] = useState<Pick[]>([]);
  const [slipOpen, setSlipOpen] = useState(false);

  const toggle = (pk: Pick) =>
    setSlip((cur) => {
      if (cur.some((x) => x.id === pk.id)) return cur.filter((x) => x.id !== pk.id);
      // One pick per match: a new pick on the same match replaces the old one.
      return [...cur.filter((x) => x.matchId !== pk.matchId), pk];
    });

  return (
    <div className="pb-24 lg:pb-0">
      {demo && (
        <div className="border-b border-line bg-surface">
          <div className="container-x flex flex-wrap items-center justify-between gap-3 py-2 text-xs">
            <span className="flex items-center gap-2">
              <span className="rounded bg-accent px-1.5 py-0.5 font-bold uppercase tracking-wider text-black">Demo</span>
              <span className="text-muted">{p.demoNote}</span>
            </span>
            <span className="flex items-center gap-3">
              <span>
                Balance <b className="tabular-nums text-ink">{money(p.currency, wallet.balance)}</b>
              </span>
              <button type="button" onClick={reset} className="font-semibold text-accent hover:underline">Reset</button>
            </span>
          </div>
        </div>
      )}

      <Promos promos={promos} />

      <div id="sports" className="container-x scroll-mt-[calc(var(--header-h)+1rem)] py-6 md:py-8">
        <Sportsbook matches={matches} slip={slip} onPick={toggle} slipEl={<BetSlip slip={slip} setSlip={setSlip} wallet={wallet} save={save} />} />
      </div>

      <GamesLobby games={games} wallet={wallet} save={save} />

      <BigCta />

      {data.faqs.length > 0 && (
        <section className="section">
          <div className="container-x grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="eyebrow mb-3">Help</p>
              <h2 className="text-4xl">{s.home.faqTitle}</h2>
              <p className="mt-4 text-sm text-muted">18+ only. If gambling stops being fun, talk to someone you trust and use the limits and breaks we offer.</p>
            </div>
            <div className="lg:col-span-8">
              <FaqList items={data.faqs} />
            </div>
          </div>
        </section>
      )}

      {/* Bet slip: a column on desktop (inside Sportsbook), a drawer on phones */}
      <button
        type="button"
        onClick={() => setSlipOpen(true)}
        className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full bg-primary px-6 py-3 font-bold text-on-primary shadow-2xl lg:hidden"
      >
        Bet slip <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-black/25 px-2 text-sm">{slip.length}</span>
      </button>
      {slipOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/60 lg:hidden" onClick={() => setSlipOpen(false)}>
          <div className="max-h-[85vh] w-full overflow-y-auto rounded-t-2xl bg-bg p-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex justify-end">
              <button type="button" onClick={() => setSlipOpen(false)} aria-label="Close bet slip" className="p-2">
                <CloseIcon size={22} />
              </button>
            </div>
            <BetSlip slip={slip} setSlip={setSlip} wallet={wallet} save={save} />
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- promotions ----------

function Promos({ promos }: { promos: Item[] }) {
  const s = useSite();
  const main = promos.filter((x) => x.featured);
  const slides = main.length ? main : promos.slice(0, 1);
  const side = promos.filter((x) => !slides.includes(x)).slice(0, 2);
  const [i, setI] = useState(0);
  useEffect(() => {
    if (slides.length < 2 || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((x) => (x + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [slides.length]);
  if (!promos.length) {
    return (
      <section className="container-x pt-6">
        <div className="rounded-[var(--radius)] bg-gradient-to-r from-primary to-accent p-8 text-on-primary md:p-12">
          <h1 className="max-w-2xl text-4xl md:text-6xl">{s.hero.title}</h1>
          {s.hero.subtitle && <p className="mt-4 max-w-xl opacity-85">{s.hero.subtitle}</p>}
        </div>
      </section>
    );
  }
  const cur = slides[i % slides.length];
  return (
    <section id="promos" className="container-x grid scroll-mt-[calc(var(--header-h)+1rem)] gap-3 pt-6 lg:grid-cols-[2fr_1fr]">
      <h1 className="sr-only">{s.hero.title}</h1>
      <PromoCard p={cur} big>
        {slides.length > 1 && (
          <div className="absolute bottom-4 right-4 flex items-center gap-2">
            <button type="button" aria-label="Previous promotion" onClick={() => setI((x) => (x - 1 + slides.length) % slides.length)} className="rounded-full bg-black/40 p-2 text-white hover:bg-black/60">
              <ArrowLeft size={16} />
            </button>
            <button type="button" aria-label="Next promotion" onClick={() => setI((x) => (x + 1) % slides.length)} className="rounded-full bg-black/40 p-2 text-white hover:bg-black/60">
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </PromoCard>
      {side.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {side.map((x) => (
            <PromoCard key={x.id} p={x} />
          ))}
        </div>
      )}
    </section>
  );
}

function PromoCard({ p, big = false, children }: { p: Item; big?: boolean; children?: ReactNode }) {
  const badge = field(p, "badge", "");
  const sub = field(p, "subtitle", "");
  const cta = field(p, "ctaLabel", "");
  const href = field(p, "ctaLink", "#sports");
  return (
    <article
      key={p.id}
      className={cn(
        "fade-up relative isolate flex overflow-hidden rounded-[var(--radius)] bg-gradient-to-br from-primary via-surface to-accent/60 text-white",
        big ? "min-h-[240px] md:min-h-[320px]" : "min-h-[150px]",
      )}
    >
      {p.image && <img src={img(p.image, big ? 1600 : 800)} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-60" />}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
      <div className={cn("flex flex-col justify-end", big ? "p-6 md:p-10" : "p-5")}>
        {badge && <span className="mb-3 w-fit rounded bg-accent px-2 py-0.5 text-[0.7rem] font-bold uppercase tracking-wider text-black">{badge}</span>}
        <h2 className={cn("max-w-xl leading-none", big ? "text-4xl md:text-6xl" : "text-2xl")}>{p.title}</h2>
        {sub && <p className={cn("mt-2 max-w-md text-white/85", big ? "md:text-lg" : "text-sm")}>{sub}</p>}
        {cta && (
          <a href={href} className={cn("btn btn-accent mt-5 w-fit !text-black", !big && "!px-4 !py-2 !text-xs")}>
            {cta}
          </a>
        )}
      </div>
      {children}
    </article>
  );
}

// ---------- sportsbook ----------

const SPORT_ORDER = ["Football", "Basketball", "Tennis", "Table Tennis", "Volleyball", "Ice Hockey", "Rugby", "Cricket", "eSports", "Boxing/MMA"];

function Sportsbook({ matches, slip, onPick, slipEl }: { matches: Item[]; slip: Pick[]; onPick: (p: Pick) => void; slipEl: ReactNode }) {
  const s = useSite();
  const demo = s.platform.mode !== "link";
  const [tab, setTab] = useState<"live" | "today" | "upcoming">("today");
  const [sport, setSport] = useState("");
  const [league, setLeague] = useState("");
  const [market, setMarket] = useState<Market>("1x2");

  // Live odds move a little every few seconds in demo mode, so the page feels alive.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!demo || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setTick((x) => x + 1), 4000);
    return () => clearInterval(t);
  }, [demo]);

  const live = matches.filter((m) => field(m, "live", false));
  const today = matches.filter((m) => {
    if (field(m, "live", false)) return false;
    const d = kickoff(field(m, "kickoff", ""));
    return d ? sameDay(d, new Date()) : false;
  });
  const upcoming = matches.filter((m) => !live.includes(m) && !today.includes(m));
  useEffect(() => {
    if (live.length) setTab("live");
    else if (!today.length && upcoming.length) setTab("upcoming");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pool = tab === "live" ? live : tab === "today" ? today : upcoming;
  const sports = useMemo(() => {
    const set = new Set(matches.map((m) => field(m, "sport", "Football")));
    return [...set].sort((a, b) => (SPORT_ORDER.indexOf(a) + 99) % 99 - ((SPORT_ORDER.indexOf(b) + 99) % 99));
  }, [matches]);
  const leagues = useMemo(() => [...new Set(matches.filter((m) => !sport || field(m, "sport", "Football") === sport).map((m) => m.grp || "Other"))], [matches, sport]);
  const shown = pool.filter((m) => (!sport || field(m, "sport", "Football") === sport) && (!league || (m.grp || "Other") === league));
  const byLeague = useMemo(() => {
    const out = new Map<string, Item[]>();
    for (const m of shown) out.set(m.grp || "Other", [...(out.get(m.grp || "Other") ?? []), m]);
    return [...out.entries()];
  }, [shown]);

  const top = matches.filter((m) => m.featured).slice(0, 4);

  return (
    <div>
      {/* sports bar */}
      <div className="-mx-4 mb-5 overflow-x-auto px-4 md:mx-0 md:px-0">
        <div className="flex w-max gap-2">
          {["", ...sports].map((sp) => (
            <button
              key={sp || "all"}
              type="button"
              onClick={() => {
                setSport(sp);
                setLeague("");
              }}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                sport === sp ? "border-primary bg-primary text-on-primary" : "border-line bg-surface text-ink hover:border-primary",
              )}
            >
              {sp || "All sports"}
              <span className="ml-1.5 opacity-60">{sp ? matches.filter((m) => field(m, "sport", "Football") === sp).length : matches.length}</span>
            </button>
          ))}
        </div>
      </div>

      {top.length > 0 && !sport && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {top.map((m) => (
            <TopMatch key={m.id} m={m} slip={slip} onPick={onPick} tick={tick} />
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[200px_minmax(0,1fr)_320px]">
        {/* leagues */}
        <aside className="hidden lg:block">
          <p className="eyebrow mb-3">Leagues</p>
          <ul className="space-y-1 text-sm">
            <li>
              <button type="button" onClick={() => setLeague("")} className={cn("w-full rounded px-3 py-2 text-left hover:bg-surface", !league && "bg-surface font-semibold text-primary")}>All leagues</button>
            </li>
            {leagues.map((l) => (
              <li key={l}>
                <button type="button" onClick={() => setLeague(l)} className={cn("flex w-full justify-between gap-2 rounded px-3 py-2 text-left hover:bg-surface", league === l && "bg-surface font-semibold text-primary")}>
                  <span className="truncate">{l}</span>
                  <span className="opacity-50">{matches.filter((m) => (m.grp || "Other") === l).length}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* matches */}
        <div id="live" className="min-w-0 scroll-mt-[calc(var(--header-h)+1rem)]">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-1 rounded-[var(--radius)] bg-surface p-1" role="tablist">
              {(
                [
                  ["live", `Live`, live.length],
                  ["today", "Today", today.length],
                  ["upcoming", "Upcoming", upcoming.length],
                ] as const
              ).map(([k, l, n]) => (
                <button
                  key={k}
                  type="button"
                  role="tab"
                  aria-selected={tab === k}
                  onClick={() => setTab(k)}
                  className={cn("flex items-center gap-2 rounded-[calc(var(--radius)-2px)] px-4 py-2 text-sm font-semibold", tab === k ? "bg-primary text-on-primary" : "text-muted hover:text-ink")}
                >
                  {k === "live" && <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />}
                  {l} <span className="opacity-60">{n}</span>
                </button>
              ))}
            </div>
            <select value={market} onChange={(e) => setMarket(e.target.value as Market)} aria-label="Market" className="rounded-[var(--radius)] border border-line bg-surface px-3 py-2 text-sm">
              <option value="1x2">1X2 (match result)</option>
              <option value="ou">Over / Under 2.5 goals</option>
            </select>
          </div>
          {/* league picker for phones */}
          {leagues.length > 1 && (
            <select value={league} onChange={(e) => setLeague(e.target.value)} aria-label="League" className="mb-3 w-full rounded-[var(--radius)] border border-line bg-surface px-3 py-2 text-sm lg:hidden">
              <option value="">All leagues</option>
              {leagues.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          )}

          {byLeague.length === 0 ? (
            <p className="rounded-[var(--radius)] border border-dashed border-line p-10 text-center text-muted">
              No {tab === "live" ? "live " : tab === "today" ? "" : "upcoming "}matches{sport ? ` in ${sport}` : ""} right now. Check the other tabs.
            </p>
          ) : (
            <div className="space-y-4">
              {byLeague.map(([lg, ms]) => (
                <div key={lg} className="overflow-hidden rounded-[var(--radius)] border border-line bg-surface">
                  <div className="flex items-center justify-between bg-bg/60 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted">
                    <span>{lg}</span>
                    <span className="hidden gap-[3.25rem] pr-8 sm:flex">{market === "1x2" ? ["1", "X", "2"].map((x) => <span key={x}>{x}</span>) : ["Over", "Under"].map((x) => <span key={x}>{x}</span>)}</span>
                  </div>
                  <ul className="divide-y divide-line">
                    {ms.map((m) => (
                      <MatchRow key={m.id} m={m} market={market} slip={slip} onPick={onPick} tick={tick} />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* bet slip */}
        <aside className="hidden lg:block">
          <div className="sticky top-[calc(var(--header-h)+1rem)]">{slipEl}</div>
        </aside>
      </div>
    </div>
  );
}

/** Odds with a small, steady wobble for live matches in demo mode. */
function liveOdds(base: number, m: Item, tick: number, salt: number) {
  if (!tick || !field(m, "live", false) || !base) return { v: base, dir: 0 };
  const wob = (k: number) => Math.sin((m.id * 7 + salt * 13 + k) * 1.7);
  const v = Math.max(1.01, Math.round((base + wob(tick) * 0.08) * 100) / 100);
  const prev = Math.max(1.01, Math.round((base + wob(tick - 1) * 0.08) * 100) / 100);
  return { v, dir: Math.sign(v - prev) };
}

function OddsBtn({ m, market, label, base, salt, slip, onPick, tick }: { m: Item; market: string; label: string; base: number; salt: number; slip: Pick[]; onPick: (p: Pick) => void; tick: number }) {
  const { v, dir } = liveOdds(base, m, tick, salt);
  const id = `${m.id}-${market}-${label}`;
  const on = slip.some((x) => x.id === id);
  if (!base) return <span className="flex h-11 min-w-[3.75rem] items-center justify-center rounded-[calc(var(--radius)-2px)] bg-bg/50 text-xs text-muted">–</span>;
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={`${label} at ${v.toFixed(2)}`}
      onClick={() => onPick({ id, matchId: m.id, match: `${field(m, "home", m.title)} vs ${field(m, "away", "")}`, market, pick: label, odds: v })}
      className={cn(
        "relative flex h-11 min-w-[3.75rem] flex-col items-center justify-center rounded-[calc(var(--radius)-2px)] text-sm font-bold tabular-nums transition-colors",
        on ? "bg-primary text-on-primary" : "bg-bg text-ink hover:bg-primary/20",
      )}
    >
      <span className="text-[0.6rem] font-semibold uppercase opacity-60 sm:hidden">{label}</span>
      {v.toFixed(2)}
      {dir !== 0 && <span className={cn("absolute right-1 top-1 text-[0.55rem]", dir > 0 ? "text-emerald-400" : "text-red-400")}>{dir > 0 ? "▲" : "▼"}</span>}
    </button>
  );
}

function teams(m: Item) {
  return { home: field(m, "home", m.title), away: field(m, "away", "") };
}

function MatchRow({ m, market, slip, onPick, tick }: { m: Item; market: Market; slip: Pick[]; onPick: (p: Pick) => void; tick: number }) {
  const isLive = field(m, "live", false);
  const t = when(field(m, "kickoff", ""));
  const { home, away } = teams(m);
  const score = field(m, "score", "");
  const [sh, sa] = score.split(/[-:]/).map((x) => x.trim());
  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap">
      <div className="w-14 shrink-0 text-xs">
        {isLive ? (
          <span className="font-bold text-red-400">{field(m, "minute", 0) ? `${field(m, "minute", 0)}'` : "LIVE"}</span>
        ) : (
          <>
            <span className="block text-muted">{t.day}</span>
            <span className="block font-semibold">{t.time}</span>
          </>
        )}
      </div>
      <div className="min-w-0 flex-1 text-sm">
        <p className="flex justify-between gap-3 truncate font-medium">
          <span className="truncate">{home}</span>
          {isLive && <span className="font-bold tabular-nums text-accent">{sh ?? 0}</span>}
        </p>
        <p className="flex justify-between gap-3 truncate font-medium">
          <span className="truncate">{away}</span>
          {isLive && <span className="font-bold tabular-nums text-accent">{sa ?? 0}</span>}
        </p>
      </div>
      <div className="flex w-full gap-1.5 sm:w-auto">
        {market === "1x2" ? (
          <>
            <OddsBtn m={m} market="1X2" label="1" base={field(m, "odds1", 0)} salt={1} slip={slip} onPick={onPick} tick={tick} />
            <OddsBtn m={m} market="1X2" label="X" base={field(m, "oddsX", 0)} salt={2} slip={slip} onPick={onPick} tick={tick} />
            <OddsBtn m={m} market="1X2" label="2" base={field(m, "odds2", 0)} salt={3} slip={slip} onPick={onPick} tick={tick} />
          </>
        ) : (
          <>
            <OddsBtn m={m} market="O/U 2.5" label="Over" base={field(m, "over", 0)} salt={4} slip={slip} onPick={onPick} tick={tick} />
            <OddsBtn m={m} market="O/U 2.5" label="Under" base={field(m, "under", 0)} salt={5} slip={slip} onPick={onPick} tick={tick} />
          </>
        )}
      </div>
    </li>
  );
}

function TopMatch({ m, slip, onPick, tick }: { m: Item; slip: Pick[]; onPick: (p: Pick) => void; tick: number }) {
  const t = when(field(m, "kickoff", ""));
  const { home, away } = teams(m);
  const isLive = field(m, "live", false);
  return (
    <div className="rounded-[var(--radius)] border border-line bg-surface p-4">
      <div className="mb-3 flex items-center justify-between text-xs text-muted">
        <span className="truncate">{m.grp}</span>
        {isLive ? <span className="font-bold text-red-400">LIVE {field(m, "score", "")}</span> : <span>{t.day} {t.time}</span>}
      </div>
      <p className="truncate font-heading text-xl leading-tight">{home}</p>
      <p className="truncate font-heading text-xl leading-tight text-muted">{away}</p>
      <div className="mt-4 grid grid-cols-3 gap-1.5">
        <OddsBtn m={m} market="1X2" label="1" base={field(m, "odds1", 0)} salt={1} slip={slip} onPick={onPick} tick={tick} />
        <OddsBtn m={m} market="1X2" label="X" base={field(m, "oddsX", 0)} salt={2} slip={slip} onPick={onPick} tick={tick} />
        <OddsBtn m={m} market="1X2" label="2" base={field(m, "odds2", 0)} salt={3} slip={slip} onPick={onPick} tick={tick} />
      </div>
    </div>
  );
}

// ---------- bet slip ----------

type SlipProps = {
  slip: Pick[];
  setSlip: (fn: (p: Pick[]) => Pick[]) => void;
  wallet: { balance: number; extra: { tickets: Ticket[] } };
  save: (w: { balance: number; extra: { tickets: Ticket[] } }) => void;
};

function BetSlip({ slip, setSlip, wallet, save }: SlipProps) {
  const s = useSite();
  const p = s.platform;
  const demo = p.mode !== "link";
  const [stake, setStake] = useState("500");
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [booking, setBooking] = useState("");
  const [view, setView] = useState<"slip" | "bets">("slip");
  const odds = slip.reduce((a, x) => a * x.odds, 1);
  const amt = Number(stake) || 0;
  const win = amt * odds;
  const tickets = wallet.extra.tickets ?? [];

  function place() {
    setMsg(null);
    if (!slip.length) return;
    if (amt < 100) return setMsg({ kind: "err", text: `The minimum stake is ${money(p.currency, 100, 0)}.` });
    if (amt > wallet.balance) return setMsg({ kind: "err", text: "Not enough demo balance. Press Reset at the top to top it up." });
    const t: Ticket = { code: code(), picks: slip, stake: amt, odds, at: Date.now() };
    save({ balance: Math.round((wallet.balance - amt) * 100) / 100, extra: { tickets: [t, ...tickets].slice(0, 20) } });
    setSlip(() => []);
    setMsg({ kind: "ok", text: `Demo bet placed. Ticket ${t.code}.` });
  }

  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-line bg-surface">
      <div className="flex border-b border-line text-sm font-semibold">
        <button type="button" onClick={() => setView("slip")} className={cn("flex-1 px-4 py-3", view === "slip" ? "border-b-2 border-primary text-ink" : "text-muted")}>
          Bet slip {slip.length > 0 && <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-on-primary">{slip.length}</span>}
        </button>
        {demo && (
          <button type="button" onClick={() => setView("bets")} className={cn("flex-1 px-4 py-3", view === "bets" ? "border-b-2 border-primary text-ink" : "text-muted")}>
            My bets {tickets.length > 0 && <span className="ml-1 opacity-60">{tickets.length}</span>}
          </button>
        )}
      </div>

      {view === "bets" ? (
        <div className="max-h-[60vh] space-y-3 overflow-y-auto p-4">
          {tickets.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">No bets yet. Pick some odds and place a demo bet.</p>
          ) : (
            tickets.map((t) => (
              <div key={t.code} className="rounded-[calc(var(--radius)-2px)] border border-line bg-bg p-3 text-sm">
                <div className="flex justify-between text-xs text-muted">
                  <span className="font-mono">{t.code}</span>
                  <span className="font-semibold text-accent">Open</span>
                </div>
                {t.picks.map((x) => (
                  <p key={x.id} className="mt-1 truncate">
                    {x.match} · <b>{x.pick}</b> @ {x.odds.toFixed(2)}
                  </p>
                ))}
                <p className="mt-2 flex justify-between border-t border-line pt-2 text-xs">
                  <span>Stake {money(p.currency, t.stake, 0)}</span>
                  <span>Potential win <b>{money(p.currency, t.stake * t.odds)}</b></span>
                </p>
              </div>
            ))
          )}
        </div>
      ) : slip.length === 0 ? (
        <div className="p-6 text-center text-sm text-muted">
          <p className="font-semibold text-ink">Your bet slip is empty</p>
          <p className="mt-1">Tap any odds to add a selection.</p>
          {booking && <p className="mt-4 rounded bg-bg p-3">Booking code <b className="font-mono text-ink">{booking}</b></p>}
          {msg && <p className={cn("mt-4 rounded p-3", msg.kind === "ok" ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400")}>{msg.text}</p>}
        </div>
      ) : (
        <div className="p-4">
          <ul className="space-y-2">
            {slip.map((x) => (
              <li key={x.id} className="flex items-start gap-2 rounded-[calc(var(--radius)-2px)] bg-bg p-3 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{x.pick} <span className="font-normal text-muted">· {x.market}</span></p>
                  <p className="truncate text-xs text-muted">{x.match}</p>
                </div>
                <span className="font-bold tabular-nums">{x.odds.toFixed(2)}</span>
                <button type="button" aria-label="Remove selection" onClick={() => setSlip((c) => c.filter((y) => y.id !== x.id))} className="text-muted hover:text-ink">
                  <CloseIcon size={16} />
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-2 text-sm">
            <p className="flex justify-between">
              <span className="text-muted">{slip.length > 1 ? `Multiple (${slip.length} selections)` : "Single"}</span>
              <span>Total odds <b className="tabular-nums">{odds.toFixed(2)}</b></span>
            </p>
            {demo && (
              <>
                <label className="flex items-center justify-between gap-3">
                  <span className="text-muted">Stake ({p.currency})</span>
                  <input
                    inputMode="numeric"
                    value={stake}
                    onChange={(e) => setStake(e.target.value.replace(/[^\d]/g, ""))}
                    className="w-32 rounded border border-line bg-bg px-3 py-2 text-right font-semibold tabular-nums outline-none focus:border-primary"
                  />
                </label>
                <div className="flex gap-1.5">
                  {[100, 500, 1000, 5000].map((v) => (
                    <button key={v} type="button" onClick={() => setStake(String(v))} className="flex-1 rounded bg-bg py-1.5 text-xs font-semibold hover:bg-primary/20">
                      {v.toLocaleString()}
                    </button>
                  ))}
                </div>
                <p className="flex justify-between border-t border-line pt-2">
                  <span className="text-muted">Potential win</span>
                  <b className="tabular-nums text-accent">{money(p.currency, win)}</b>
                </p>
              </>
            )}
          </div>
          {msg && <p className={cn("mt-3 rounded p-3 text-sm", msg.kind === "ok" ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400")}>{msg.text}</p>}
          <div className="mt-4 grid gap-2">
            {demo ? (
              <button type="button" onClick={place} className="btn btn-primary w-full">Place demo bet</button>
            ) : (
              <PlatformButton className="w-full" />
            )}
            <button type="button" onClick={() => setBooking(code(6))} className="btn btn-outline w-full !py-2.5 text-sm">
              Get booking code
            </button>
            {booking && (
              <p className="rounded bg-bg p-3 text-center text-sm">
                Booking code <b className="font-mono text-ink">{booking}</b>
                {demo && <span className="block text-xs text-muted">(demo code)</span>}
              </p>
            )}
            <button type="button" onClick={() => setSlip(() => [])} className="text-xs text-muted hover:text-ink">Clear slip</button>
          </div>
        </div>
      )}
      <p className="border-t border-line px-4 py-2 text-center text-[0.7rem] text-muted">18+ · Bet responsibly</p>
    </div>
  );
}

/** Link-mode button to the client's real platform (or WhatsApp if no address is set). */
function PlatformButton({ className }: { className?: string }) {
  const s = useSite();
  const href = s.platform.url || (s.contact.whatsapp ? waLink(s.contact.whatsapp, s.contact.whatsappMessage) : "/contact");
  return (
    <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className={cn("btn btn-primary", className)}>
      {s.platform.label || "Continue"} <ArrowRight size={16} />
    </a>
  );
}

// ---------- games lobby ----------

type WalletProps = Omit<SlipProps, "slip" | "setSlip">;

function GamesLobby({ games, wallet, save }: { games: Item[] } & WalletProps) {
  const s = useSite();
  const demo = s.platform.mode !== "link";
  const cats = useMemo(() => [...new Set(games.map((g) => g.grp || "Games"))], [games]);
  const [cat, setCat] = useState("");
  const [open, setOpen] = useState<Item | null>(null);
  if (!games.length) return null;
  const shown = games.filter((g) => !cat || (g.grp || "Games") === cat);
  return (
    <section id="casino" className="scroll-mt-[calc(var(--header-h)+1rem)] border-y border-line bg-surface py-10 md:py-14">
      <div className="container-x">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-2">Games</p>
            <h2 className="text-4xl md:text-5xl">Casino & virtuals</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {["", ...cats].map((c) => (
              <button key={c || "all"} type="button" onClick={() => setCat(c)} className={cn("rounded-full border px-4 py-1.5 text-sm font-semibold", cat === c ? "border-accent bg-accent text-black" : "border-line text-ink hover:border-accent")}>
                {c || "All"}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {shown.map((g) => (
            <button key={g.id} type="button" onClick={() => setOpen(g)} className="group relative overflow-hidden rounded-[var(--radius)] bg-bg text-left">
              <div
                className="img-zoom flex aspect-[4/5] max-w-full items-center justify-center overflow-hidden bg-gradient-to-br from-primary/40 to-accent/40"
                style={field(g, "color", "") ? { background: `radial-gradient(circle at 30% 20%, ${field(g, "color", "")}, #0b1220 85%)` } : undefined}
              >
                {g.image ? (
                  <img src={img(g.image, 500)} alt="" loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <span className="pb-10 text-6xl drop-shadow-lg" aria-hidden>{field(g, "emoji", "🎰")}</span>
                )}
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-3 text-white">
                <p className="truncate font-heading text-lg leading-tight">{g.title}</p>
                <p className="truncate text-xs text-white/70">{field(g, "provider", g.grp)}</p>
              </div>
              {!!g.featured && <span className="absolute left-2 top-2 rounded bg-red-500 px-1.5 py-0.5 text-[0.65rem] font-bold uppercase text-white">Hot</span>}
              <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="btn btn-accent !text-black">Play</span>
              </span>
            </button>
          ))}
        </div>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setOpen(null)}>
          <div className="w-full max-w-md overflow-hidden rounded-[var(--radius)] bg-bg" onClick={(e) => e.stopPropagation()}>
            <div className="relative aspect-video bg-gradient-to-br from-primary/50 to-accent/50">
              {open.image && <img src={img(open.image, 900)} alt="" className="h-full w-full object-cover" />}
              <button type="button" onClick={() => setOpen(null)} aria-label="Close" className="absolute right-2 top-2 rounded-full bg-black/50 p-2 text-white">
                <CloseIcon size={18} />
              </button>
            </div>
            <div className="p-6">
              <h3 className="text-3xl">{open.title}</h3>
              <p className="mt-1 text-sm text-muted">{[open.grp, field(open, "provider", "")].filter(Boolean).join(" · ")}</p>
              {field(open, "description", "") && <p className="mt-3 text-sm leading-relaxed">{field(open, "description", "")}</p>}
              {demo ? (
                <QuickSpin key={open.id} game={open} wallet={wallet} save={save} />
              ) : (
                <PlatformButton className="mt-5 w-full" />
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// ---------- demo mini-game: three reels with the game's own symbols ----------

const REELS = ["🍒", "🍋", "🔔", "⭐", "💎", "7️⃣"];

function QuickSpin({ game, wallet, save }: { game: Item } & WalletProps) {
  const s = useSite();
  const cur = s.platform.currency;
  const symbols = [field(game, "emoji", ""), ...REELS].filter(Boolean).slice(0, 6);
  const [stake, setStake] = useState(100);
  const [reels, setReels] = useState([symbols[0], symbols[1], symbols[2]]);
  const [spinning, setSpinning] = useState(false);
  const [msg, setMsg] = useState("");
  const spin = () => {
    if (spinning) return;
    if (stake > wallet.balance) return setMsg("Not enough demo balance. Tap Reset at the top of the page.");
    setSpinning(true);
    setMsg("");
    let n = 0;
    const roll = () => [0, 1, 2].map(() => symbols[Math.floor(Math.random() * symbols.length)]);
    const t = setInterval(() => {
      setReels(roll());
      if (++n < 12) return;
      clearInterval(t);
      const end = roll();
      setReels(end);
      const same = new Set(end).size;
      const mult = same === 1 ? 10 : same === 2 ? 2 : 0;
      const win = stake * mult;
      save({ ...wallet, balance: Math.round((wallet.balance - stake + win) * 100) / 100 });
      setMsg(win ? `You won ${money(cur, win, 0)} (demo)` : "No win this time.");
      setSpinning(false);
    }, 80);
  };
  return (
    <div className="mt-5 rounded-[var(--radius)] bg-surface p-4">
      <p className="mb-3 text-xs font-bold uppercase tracking-wider text-accent">Demo spin · fake money</p>
      <div className="flex justify-center gap-2" aria-live="polite">
        {reels.map((r, i) => (
          <span key={i} className={cn("flex h-20 w-20 items-center justify-center rounded-xl border border-line bg-bg text-5xl", spinning && "blur-[1px]")}>{r}</span>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {[100, 500, 1000].map((v) => (
          <button key={v} type="button" onClick={() => setStake(v)} className={cn("rounded-full border px-3 py-1 text-sm font-semibold", stake === v ? "border-accent bg-accent text-black" : "border-line")}>
            {money(cur, v, 0)}
          </button>
        ))}
        <button type="button" onClick={spin} disabled={spinning} className="btn btn-primary !py-2">{spinning ? "Spinning…" : "Spin"}</button>
      </div>
      <p className="mt-3 text-center text-sm">{msg || "Three of a kind pays 10×, two pays 2×."}</p>
      <p className="mt-2 text-center text-xs text-muted">Demo website: no real money. On a live site this opens the game on the operator's licensed platform. 18+.</p>
    </div>
  );
}

// ---------- closing band ----------

function BigCta() {
  const s = useSite();
  const h = s.home;
  return (
    <section className="relative overflow-hidden">
      {h.ctaImage && <img src={img(h.ctaImage, 2000)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-primary/40" />
      <div className="container-x relative grid items-center gap-8 py-16 text-white md:grid-cols-[1.4fr_1fr] md:py-20">
        <div>
          <h2 className="text-4xl md:text-6xl">{h.ctaTitle}</h2>
          <p className="mt-4 max-w-xl text-white/80">{h.ctaText}</p>
        </div>
        <div className="flex flex-wrap gap-3 md:justify-end">
          {s.features.quotes && <Link to="/quote" className="btn btn-accent !text-black">{s.labels.quoteCta}</Link>}
          {s.features.portfolio && <Link to="/portfolio" className="btn btn-outline text-white">{s.labels.items}</Link>}
        </div>
      </div>
    </section>
  );
}
