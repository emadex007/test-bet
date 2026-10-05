// Crypto industry home page: an exchange-style site with live prices and 7-day charts from CoinGecko,
// a price ticker, a markets table, a buy/sell panel and a demo portfolio. Coins are managed in the dashboard.
// In demo mode visitors trade with fake money; in link mode the panel sends them to the real platform.
import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { getCryptoPrices, type CoinPrice } from "~/lib/api";
import { cn, img, useSite, waLink } from "~/lib/ui";
import { field, type Item } from "~/packs/collections";
import { FaqList } from "~/components/FaqList";
import { ProjectGrid } from "~/components/ui";
import { ArrowRight } from "~/components/Icons";
import type { HomeData } from "./types";
import { money, useDemoWallet } from "./demo";

type Coin = { item: Item; id: string; symbol: string; name: string; color: string; usd: number; change: number; cap: number; spark: number[]; live: boolean };
type Holdings = Record<string, { qty: number; cost: number }>;

// ---------- prices ----------

function usePrices(items: Item[]): Coin[] {
  const ids = items.map((i) => field(i, "cgId", "")).filter(Boolean);
  const [live, setLive] = useState<Record<string, CoinPrice>>({});
  useEffect(() => {
    if (!ids.length) return;
    let alive = true;
    const load = () =>
      getCryptoPrices({ data: ids })
        .then((p) => alive && setLive(p))
        .catch(() => {});
    load();
    const t = setInterval(load, 60_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [ids.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  return items.map((i) => {
    const id = field(i, "cgId", "");
    const p = live[id];
    const usd = p?.usd ?? field(i, "priceUsd", 0);
    const change = p?.change24h ?? field(i, "change24", 0);
    return {
      item: i,
      id: id || String(i.id),
      symbol: field(i, "symbol", i.title.slice(0, 3)).toUpperCase(),
      name: i.title,
      color: field(i, "color", "#F7931A"),
      usd,
      change,
      cap: p?.marketCap ?? 0,
      spark: p?.spark?.length ? p.spark : sampleLine(usd, change, i.id),
      live: !!p,
    };
  });
}

/** Until live prices arrive, an approximate line that ends at the current price. */
function sampleLine(price: number, change: number, seed: number) {
  let x = seed * 9301 + 49297;
  const rnd = () => ((x = (x * 9301 + 49297) % 233280) / 233280 - 0.5) * 0.03;
  const start = price / (1 + (change * 3) / 100 || 1);
  return Array.from({ length: 42 }, (_, i) => (i === 41 ? price : start + ((price - start) * i) / 41) * (1 + (i === 41 ? 0 : rnd())));
}

const fmtUsd = (n: number) => (n >= 1 ? `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}` : `$${n.toPrecision(3)}`);
const fmtNgn = (n: number, cur: string) => (n >= 100 ? `${cur}${Math.round(n).toLocaleString("en-NG")}` : `${cur}${n.toLocaleString("en-NG", { maximumFractionDigits: 4 })}`);
const fmtCap = (n: number) => (n >= 1e12 ? `$${(n / 1e12).toFixed(2)}T` : n >= 1e9 ? `$${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(0)}M` : n ? `$${n}` : "–");

function Change({ v, className }: { v: number; className?: string }) {
  return <span className={cn("font-semibold tabular-nums", v >= 0 ? "text-emerald-500" : "text-red-500", className)}>{v >= 0 ? "▲" : "▼"} {Math.abs(v).toFixed(2)}%</span>;
}

function Spark({ data, up, h = 40, w = 120, fill = false }: { data: number[]; up: boolean; h?: number; w?: number; fill?: boolean }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const pts = data.map((v, i) => `${((i / (data.length - 1)) * w).toFixed(1)},${(h - 2 - ((v - min) / (max - min || 1)) * (h - 4)).toFixed(1)}`);
  const color = up ? "#10b981" : "#ef4444";
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none" aria-hidden className="block">
      {fill && <polygon points={`0,${h} ${pts.join(" ")} ${w},${h}`} fill={color} opacity="0.12" />}
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function CoinBadge({ c, size = 36 }: { c: Coin; size?: number }) {
  return c.item.image ? (
    <img src={img(c.item.image, 120)} alt="" width={size} height={size} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />
  ) : (
    <span className="flex shrink-0 items-center justify-center rounded-full font-bold text-white" style={{ width: size, height: size, background: c.color, fontSize: size * 0.36 }}>
      {c.symbol.slice(0, 3)}
    </span>
  );
}

// ---------- page ----------

export function CryptoHome({ data }: { data: HomeData }) {
  const s = useSite();
  const p = s.platform;
  const demo = p.mode !== "link";
  const coins = usePrices(data.items.coin ?? []);
  const [cur, setCur] = useState<"NGN" | "USD">("NGN");
  const rate = Number(p.usdRate) || 1500;
  const show = (usd: number) => (cur === "USD" ? fmtUsd(usd) : fmtNgn(usd * rate, p.currency));
  const [sel, setSel] = useState<string>("");
  const selected = coins.find((c) => c.id === sel) ?? coins.find((c) => c.item.featured) ?? coins[0];
  const { wallet, save, reset } = useDemoWallet<{ holdings: Holdings }>(Number(p.demoBalance) || 500000, { holdings: {} });
  const anyLive = coins.some((c) => c.live);

  const pick = (id: string) => {
    setSel(id);
    document.getElementById("trade")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div>
      {demo && (
        <div className="border-b border-line bg-surface">
          <div className="container-x flex flex-wrap items-center justify-between gap-3 py-2 text-xs">
            <span className="flex items-center gap-2">
              <span className="rounded bg-accent px-1.5 py-0.5 font-bold uppercase tracking-wider text-black">Demo</span>
              <span className="text-muted">{p.demoNote}</span>
            </span>
            <span className="flex items-center gap-3">
              Demo balance <b className="tabular-nums text-ink">{money(p.currency, wallet.balance)}</b>
              <button type="button" onClick={reset} className="font-semibold text-accent hover:underline">Reset</button>
            </span>
          </div>
        </div>
      )}

      {/* ticker */}
      {coins.length > 0 && (
        <div className="overflow-hidden border-b border-line bg-bg py-2.5 text-sm" aria-label="Prices">
          <div className="marquee-track flex w-max gap-8" style={{ animationDuration: `${Math.max(25, coins.length * 6)}s` }}>
            {[...coins, ...coins].map((c, i) => (
              <button key={c.id + i} type="button" onClick={() => pick(c.id)} className="flex items-center gap-2 whitespace-nowrap">
                <b>{c.symbol}</b>
                <span className="tabular-nums">{show(c.usd)}</span>
                <Change v={c.change} className="text-xs" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-accent/20 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-40 -left-40 h-[420px] w-[420px] rounded-full bg-primary/20 blur-3xl" aria-hidden />
        <div className="container-x relative grid items-center gap-12 py-14 md:py-20 lg:grid-cols-[1.1fr_1fr]">
          <div>
            {s.hero.eyebrow && <p className="eyebrow fade-up mb-5">{s.hero.eyebrow}</p>}
            <h1 className="fade-up text-balance text-5xl leading-[1.02] md:text-7xl">{s.hero.title}</h1>
            {s.hero.subtitle && <p className="fade-up-2 mt-6 max-w-xl text-lg leading-relaxed text-muted">{s.hero.subtitle}</p>}
            <div className="fade-up-3 mt-9 flex flex-wrap gap-3">
              <a href="#trade" className="btn btn-accent !text-black">Buy {selected?.symbol ?? "crypto"} <ArrowRight size={16} /></a>
              <a href="#markets" className="btn btn-outline">View markets</a>
            </div>
            <p className="mt-8 max-w-md text-xs text-muted">Crypto prices move fast and you can lose money. Nothing on this website is financial advice. We will never ask for your seed phrase or private keys.</p>
          </div>
          {selected && (
            <div className="fade-up-2 rounded-[calc(var(--radius)+8px)] border border-line bg-surface p-6 shadow-2xl">
              <div className="flex items-center gap-3">
                <CoinBadge c={selected} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="font-heading text-2xl leading-none">{selected.name}</p>
                  <p className="text-sm text-muted">{selected.symbol}</p>
                </div>
                <Change v={selected.change} />
              </div>
              <p className="mt-5 font-heading text-5xl tabular-nums">{show(selected.usd)}</p>
              <p className="text-sm text-muted">{cur === "NGN" ? fmtUsd(selected.usd) : fmtNgn(selected.usd * rate, p.currency)} · 24h</p>
              <div className="mt-5">
                <Spark data={selected.spark} up={selected.spark[selected.spark.length - 1] >= selected.spark[0]} h={110} w={400} fill />
              </div>
              <p className="mt-2 text-right text-[0.7rem] text-muted">{selected.live ? "Last 7 days · live" : "Approximate · waiting for live prices"}</p>
            </div>
          )}
        </div>
      </section>

      {/* markets */}
      <Markets coins={coins} show={show} cur={cur} setCur={setCur} onTrade={pick} />

      {/* trade */}
      {selected && <Trade coins={coins} selected={selected} setSel={setSel} rate={rate} wallet={wallet} save={save} demo={demo} />}

      {/* how it works */}
      {s.home.process.length > 0 && (
        <section className="section bg-surface">
          <div className="container-x">
            <p className="eyebrow mb-3">{s.home.processEyebrow}</p>
            <h2 className="max-w-2xl text-4xl md:text-5xl">{s.home.processTitle}</h2>
            <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {s.home.process.map((st, i) => (
                <li key={st.title} className="rounded-[var(--radius)] border border-line bg-bg p-6">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent font-bold text-black">{i + 1}</span>
                  <h3 className="mt-5 text-2xl">{st.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{st.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* academy */}
      {s.features.portfolio && data.projects.length > 0 && (
        <section className="section">
          <div className="container-x">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow mb-3">{s.home.projectsEyebrow}</p>
                <h2 className="text-4xl md:text-5xl">{s.home.projectsTitle}</h2>
              </div>
              <Link to="/portfolio" className="btn btn-outline">All {s.labels.items.toLowerCase()} <ArrowRight size={16} /></Link>
            </div>
            <ProjectGrid items={data.projects.slice(0, 3)} />
          </div>
        </section>
      )}

      {/* safety */}
      <section className="section bg-surface">
        <div className="container-x grid gap-6 md:grid-cols-3">
          {[
            ["We never ask for your keys", "Nobody from our team will ever ask for your seed phrase, private keys, passwords or one-time codes."],
            ["Verified trades", "Every trade is checked and confirmed in writing, with the rate and fee shown before you agree."],
            ["No promised returns", "Anyone promising fixed profits from crypto is not being honest. Learn first, and only use money you can afford to lose."],
          ].map(([t, d]) => (
            <div key={t} className="rounded-[var(--radius)] border border-line bg-bg p-6">
              <h3 className="text-2xl">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {data.faqs.length > 0 && (
        <section className="section">
          <div className="container-x grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="eyebrow mb-3">Questions</p>
              <h2 className="text-4xl md:text-5xl">{s.home.faqTitle}</h2>
            </div>
            <div className="lg:col-span-8">
              <FaqList items={data.faqs} />
            </div>
          </div>
        </section>
      )}

      <p className="container-x pb-8 text-center text-xs text-muted">
        {anyLive ? (
          <>
            Prices by{" "}
            <a href="https://www.coingecko.com" target="_blank" rel="noopener noreferrer" className="underline">
              CoinGecko
            </a>
            , updated every minute. Naira prices use a rate of {p.currency}
            {rate.toLocaleString()} per dollar.
          </>
        ) : (
          "Prices shown are from our dashboard while live prices load."
        )}
      </p>
    </div>
  );
}

// ---------- markets table ----------

function Markets({ coins, show, cur, setCur, onTrade }: { coins: Coin[]; show: (usd: number) => string; cur: "NGN" | "USD"; setCur: (c: "NGN" | "USD") => void; onTrade: (id: string) => void }) {
  const [tab, setTab] = useState<"all" | "up" | "down">("all");
  const [q, setQ] = useState("");
  const list = coins
    .filter((c) => (tab === "up" ? c.change >= 0 : tab === "down" ? c.change < 0 : true))
    .filter((c) => !q || `${c.name} ${c.symbol}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (tab === "up" ? b.change - a.change : tab === "down" ? a.change - b.change : 0));
  if (!coins.length) return null;
  return (
    <section id="markets" className="section scroll-mt-[var(--header-h)]">
      <div className="container-x">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-3">Markets</p>
            <h2 className="text-4xl md:text-5xl">Today's prices</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search coin" aria-label="Search coin" className="w-40 rounded-[var(--radius)] border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent" />
            <div className="flex rounded-[var(--radius)] border border-line bg-surface p-0.5 text-sm">
              {(["NGN", "USD"] as const).map((c) => (
                <button key={c} type="button" onClick={() => setCur(c)} className={cn("rounded-[calc(var(--radius)-2px)] px-3 py-1.5 font-semibold", cur === c ? "bg-accent text-black" : "text-muted")}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="mb-3 flex gap-2">
          {(
            [
              ["all", "All"],
              ["up", "Gainers"],
              ["down", "Losers"],
            ] as const
          ).map(([k, l]) => (
            <button key={k} type="button" onClick={() => setTab(k)} className={cn("rounded-full border px-4 py-1.5 text-sm font-semibold", tab === k ? "border-ink bg-ink text-bg" : "border-line text-muted hover:text-ink")}>
              {l}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto rounded-[var(--radius)] border border-line bg-surface">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Coin</th>
                <th className="px-4 py-3 text-right font-semibold">Price</th>
                <th className="px-4 py-3 text-right font-semibold">24h</th>
                <th className="hidden px-4 py-3 text-right font-semibold md:table-cell">Market cap</th>
                <th className="px-4 py-3 font-semibold">7 days</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.map((c, i) => (
                <tr key={c.id} className="hover:bg-bg/50">
                  <td className="px-4 py-3 text-muted">{i + 1}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-3">
                      <CoinBadge c={c} size={32} />
                      <span>
                        <b className="block">{c.name}</b>
                        <span className="text-xs text-muted">{c.symbol}</span>
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">{show(c.usd)}</td>
                  <td className="px-4 py-3 text-right">
                    <Change v={c.change} />
                  </td>
                  <td className="hidden px-4 py-3 text-right tabular-nums text-muted md:table-cell">{fmtCap(c.cap)}</td>
                  <td className="w-32 px-4 py-3">
                    <Spark data={c.spark} up={c.spark[c.spark.length - 1] >= c.spark[0]} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" onClick={() => onTrade(c.id)} className="btn btn-accent !px-4 !py-2 !text-xs !text-black">Trade</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// ---------- buy / sell ----------

function Trade({
  coins,
  selected,
  setSel,
  rate,
  wallet,
  save,
  demo,
}: {
  coins: Coin[];
  selected: Coin;
  setSel: (id: string) => void;
  rate: number;
  wallet: { balance: number; extra: { holdings: Holdings } };
  save: (w: { balance: number; extra: { holdings: Holdings } }) => void;
  demo: boolean;
}) {
  const s = useSite();
  const p = s.platform;
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [amt, setAmt] = useState("50000");
  const [range, setRange] = useState<"24h" | "7d">("7d");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const FEE = 0.01;
  const priceNgn = selected.usd * rate;
  const holdings = wallet.extra.holdings ?? {};
  const held = holdings[selected.id]?.qty ?? 0;
  const naira = Number(amt) || 0;
  const qty = priceNgn ? (naira * (1 - FEE)) / priceNgn : 0;
  const line = range === "24h" ? selected.spark.slice(-7) : selected.spark;

  useEffect(() => setMsg(null), [selected.id, side]);

  function submit() {
    setMsg(null);
    if (naira < 1000) return setMsg({ ok: false, text: `The minimum is ${p.currency}1,000.` });
    if (side === "buy") {
      if (naira > wallet.balance) return setMsg({ ok: false, text: "Not enough demo balance. Press Reset at the top to top it up." });
      const h = holdings[selected.id] ?? { qty: 0, cost: 0 };
      save({ balance: wallet.balance - naira, extra: { holdings: { ...holdings, [selected.id]: { qty: h.qty + qty, cost: h.cost + naira } } } });
      setMsg({ ok: true, text: `Demo: bought ${qty.toFixed(6)} ${selected.symbol}.` });
    } else {
      const sellQty = naira / priceNgn;
      if (sellQty > held + 1e-12) return setMsg({ ok: false, text: `You only hold ${held.toFixed(6)} ${selected.symbol} in this demo.` });
      const h = holdings[selected.id];
      const left = Math.max(0, h.qty - sellQty);
      const next = { ...holdings };
      if (left < 1e-9) delete next[selected.id];
      else next[selected.id] = { qty: left, cost: h.cost * (left / h.qty) };
      save({ balance: wallet.balance + naira * (1 - FEE), extra: { holdings: next } });
      setMsg({ ok: true, text: `Demo: sold ${sellQty.toFixed(6)} ${selected.symbol}.` });
    }
  }

  const portfolio = Object.entries(holdings)
    .map(([id, h]) => {
      const c = coins.find((x) => x.id === id);
      return c ? { c, h, value: h.qty * c.usd * rate } : null;
    })
    .filter(Boolean) as { c: Coin; h: { qty: number; cost: number }; value: number }[];
  const pValue = portfolio.reduce((a, x) => a + x.value, 0);
  const pCost = portfolio.reduce((a, x) => a + x.h.cost, 0);

  const contact = s.platform.url || (s.contact.whatsapp ? waLink(s.contact.whatsapp, `Hello ${s.brand.name}, I'd like to ${side} ${selected.symbol}.`) : "/contact");

  return (
    <section id="trade" className="section scroll-mt-[var(--header-h)] bg-surface">
      <div className="container-x grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* chart */}
        <div className="rounded-[var(--radius)] border border-line bg-bg p-6">
          <div className="flex flex-wrap items-center gap-3">
            <select value={selected.id} onChange={(e) => setSel(e.target.value)} aria-label="Coin" className="rounded-[var(--radius)] border border-line bg-surface px-3 py-2 font-semibold">
              {coins.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.symbol})</option>
              ))}
            </select>
            <Change v={selected.change} />
            <div className="ml-auto flex rounded-[var(--radius)] border border-line p-0.5 text-xs">
              {(["24h", "7d"] as const).map((r) => (
                <button key={r} type="button" onClick={() => setRange(r)} className={cn("rounded-[calc(var(--radius)-2px)] px-3 py-1.5 font-semibold uppercase", range === r ? "bg-ink text-bg" : "text-muted")}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          <p className="mt-5 font-heading text-5xl tabular-nums">{fmtNgn(priceNgn, p.currency)}</p>
          <p className="text-sm text-muted">{fmtUsd(selected.usd)}</p>
          <div className="mt-6">
            <Spark data={line} up={line[line.length - 1] >= line[0]} h={220} w={600} fill />
          </div>
          {field(selected.item, "about", "") && <p className="mt-6 text-sm leading-relaxed text-muted">{field(selected.item, "about", "")}</p>}
        </div>

        {/* panel */}
        <div className="flex flex-col gap-6">
          <div className="rounded-[var(--radius)] border border-line bg-bg p-6">
            <div className="grid grid-cols-2 gap-1 rounded-[var(--radius)] bg-surface p-1">
              {(["buy", "sell"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setSide(k)}
                  className={cn("rounded-[calc(var(--radius)-2px)] py-2.5 font-bold capitalize", side === k ? (k === "buy" ? "bg-emerald-500 text-white" : "bg-red-500 text-white") : "text-muted")}
                >
                  {k}
                </button>
              ))}
            </div>
            <label className="mt-5 block text-sm">
              <span className="mb-1.5 block font-semibold">Amount ({p.currency})</span>
              <input
                inputMode="numeric"
                value={amt}
                onChange={(e) => setAmt(e.target.value.replace(/[^\d]/g, ""))}
                className="w-full rounded-[var(--radius)] border border-line bg-surface px-4 py-3 text-lg font-semibold tabular-nums outline-none focus:border-accent"
              />
            </label>
            <div className="mt-2 flex gap-1.5">
              {[10000, 50000, 100000, 500000].map((v) => (
                <button key={v} type="button" onClick={() => setAmt(String(v))} className="flex-1 rounded bg-surface py-1.5 text-xs font-semibold hover:bg-accent/20">
                  {v >= 1000 ? `${v / 1000}k` : v}
                </button>
              ))}
            </div>
            <dl className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Rate</dt>
                <dd className="tabular-nums">1 {selected.symbol} = {fmtNgn(priceNgn, p.currency)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Fee (1%)</dt>
                <dd className="tabular-nums">{fmtNgn(naira * FEE, p.currency)}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-2">
                <dt className="text-muted">{side === "buy" ? "You get about" : "You receive about"}</dt>
                <dd className="font-bold tabular-nums">{side === "buy" ? `${qty.toFixed(6)} ${selected.symbol}` : fmtNgn(naira * (1 - FEE), p.currency)}</dd>
              </div>
            </dl>
            {msg && <p className={cn("mt-4 rounded p-3 text-sm", msg.ok ? "bg-emerald-500/15 text-emerald-500" : "bg-red-500/15 text-red-500")}>{msg.text}</p>}
            {demo ? (
              <button type="button" onClick={submit} className={cn("btn mt-5 w-full text-white", side === "buy" ? "!bg-emerald-500" : "!bg-red-500")}>
                {side === "buy" ? "Buy" : "Sell"} {selected.symbol} (demo)
              </button>
            ) : (
              <a href={contact} target={contact.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="btn btn-accent mt-5 w-full !text-black">
                {s.platform.label || `${side === "buy" ? "Buy" : "Sell"} ${selected.symbol}`} <ArrowRight size={16} />
              </a>
            )}
            {s.features.quotes && (
              <Link to="/quote" search={{ service: `${side === "buy" ? "Buy" : "Sell"} ${selected.symbol}` }} className="mt-3 block text-center text-sm font-semibold text-accent hover:underline">
                Large amount? Request an OTC quote
              </Link>
            )}
          </div>

          {demo && (
            <div className="rounded-[var(--radius)] border border-line bg-bg p-6">
              <div className="flex items-baseline justify-between">
                <h3 className="text-2xl">Demo portfolio</h3>
                <span className="text-sm text-muted">Cash {money(p.currency, wallet.balance, 0)}</span>
              </div>
              {portfolio.length === 0 ? (
                <p className="mt-3 text-sm text-muted">Buy a coin to see it here.</p>
              ) : (
                <>
                  <ul className="mt-4 space-y-3">
                    {portfolio.map(({ c, h, value }) => (
                      <li key={c.id} className="flex items-center gap-3 text-sm">
                        <CoinBadge c={c} size={28} />
                        <span className="min-w-0 flex-1">
                          <b>{c.symbol}</b> <span className="text-muted">{h.qty.toFixed(6)}</span>
                        </span>
                        <span className="text-right tabular-nums">
                          {fmtNgn(value, p.currency)}
                          <Change v={h.cost ? ((value - h.cost) / h.cost) * 100 : 0} className="block text-xs" />
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 flex justify-between border-t border-line pt-3 text-sm">
                    <span className="text-muted">Total value</span>
                    <b className="tabular-nums">{fmtNgn(pValue, p.currency)}</b>
                  </p>
                  {pCost > 0 && (
                    <p className="flex justify-end text-xs">
                      <Change v={((pValue - pCost) / pCost) * 100} />
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
