// Server functions called from routes. Bodies run only on the Worker.
import { createServerFn } from "@tanstack/react-start";
import {
  listClients,
  listFaqs,
  listItems,
  getProjectBySlug,
  listProjects,
  listServices,
  listTestimonials,
  loadSettings,
  makeRef,
  notifyAdmin,
} from "~/server/db";
import { env } from "~/lib/env";
import { COLLECTIONS } from "~/lib/pack";

// ---------- reads ----------

export const getSite = createServerFn({ method: "GET" }).handler(async () => loadSettings());

export const getHomeData = createServerFn({ method: "GET" }).handler(async () => {
  const [services, featured, testimonials, clients, faqs, items] = await Promise.all([
    listServices(),
    listProjects({ featuredOnly: true, limit: 6 }),
    listTestimonials(),
    listClients(),
    listFaqs(),
    listItems(COLLECTIONS.map((c) => c.kind)),
  ]);
  // Fall back to latest projects if nothing is marked featured.
  const projects = featured.length ? featured : await listProjects({ limit: 6 });
  return { services, projects, testimonials, clients, faqs, items };
});

/** Items of one industry collection, e.g. all matches or all coins. */
export const getItems = createServerFn({ method: "GET" })
  .inputValidator((kind: string) => String(kind).slice(0, 40))
  .handler(async ({ data: kind }) => (await listItems([kind]))[kind] ?? []);

// ---------- live crypto prices (CoinGecko, cached for a minute) ----------

export type CoinPrice = { usd: number; change24h: number; marketCap: number; spark: number[] };
let priceCache: { at: number; key: string; prices: Record<string, CoinPrice> } | null = null;

/**
 * Live USD prices, 24h change, market cap and a 7-day price line for CoinGecko coin ids, in one request,
 * cached for a minute. Returns {} when CoinGecko can't be reached (the site then shows the dashboard's prices).
 */
export const getCryptoPrices = createServerFn({ method: "GET" })
  .inputValidator((ids: string[]) => (Array.isArray(ids) ? ids : []).map((x) => String(x).toLowerCase().replace(/[^a-z0-9-]/g, "")).filter(Boolean).slice(0, 40))
  .handler(async ({ data: ids }): Promise<Record<string, CoinPrice>> => {
    if (!ids.length) return {};
    const key = [...ids].sort().join(",");
    if (priceCache && priceCache.key === key && Date.now() - priceCache.at < 60_000) return priceCache.prices;
    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${key}&sparkline=true&price_change_percentage=24h`,
        { headers: { accept: "application/json", "user-agent": "emadex-starter" } },
      );
      if (!res.ok) throw new Error(String(res.status));
      const raw = (await res.json()) as { id: string; current_price?: number; price_change_percentage_24h?: number; market_cap?: number; sparkline_in_7d?: { price?: number[] } }[];
      const prices: Record<string, CoinPrice> = {};
      for (const c of raw) {
        if (typeof c?.current_price !== "number") continue;
        const line = c.sparkline_in_7d?.price ?? [];
        // About 4 points a day is plenty for a small chart.
        const step = Math.max(1, Math.floor(line.length / 42));
        prices[c.id] = {
          usd: c.current_price,
          change24h: Number(c.price_change_percentage_24h) || 0,
          marketCap: Number(c.market_cap) || 0,
          spark: line.filter((_, i) => i % step === 0 || i === line.length - 1),
        };
      }
      priceCache = { at: Date.now(), key, prices };
      return prices;
    } catch (err) {
      console.error("CoinGecko prices failed", err);
      return priceCache?.key === key ? priceCache.prices : {};
    }
  });

export const getFaqs = createServerFn({ method: "GET" }).handler(async () => listFaqs());

export const getServices = createServerFn({ method: "GET" }).handler(async () => listServices());

export const getPortfolio = createServerFn({ method: "GET" }).handler(async () => listProjects());

export const getProject = createServerFn({ method: "GET" })
  .inputValidator((slug: string) => String(slug).slice(0, 120))
  .handler(async ({ data }) => getProjectBySlug(data));

// ---------- form helpers ----------

type FormResult = { ok: true; ref: string } | { ok: false; error: string };

const clean = (v: unknown, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isPhone = (v: string) => v.replace(/[^\d]/g, "").length >= 7;

function requireContact(name: string, phone: string, email: string): string | null {
  if (name.length < 2) return "Please enter your name.";
  if (!isPhone(phone)) return "Please enter a valid phone number.";
  if (email && !isEmail(email)) return "Please enter a valid email address.";
  return null;
}

// ---------- booking ----------

export type BookingInput = {
  name: string;
  email: string;
  phone: string;
  service: string;
  visitType: string;
  date: string;
  time: string;
  address: string;
  notes: string;
  website?: string; // honeypot
};

export const submitBooking = createServerFn({ method: "POST" })
  .inputValidator((d: BookingInput) => d)
  .handler(async ({ data }): Promise<FormResult> => {
    if (clean(data.website)) return { ok: true, ref: "OK" }; // bot
    const name = clean(data.name, 120);
    const email = clean(data.email, 160);
    const phone = clean(data.phone, 40);
    const err = requireContact(name, phone, email);
    if (err) return { ok: false, error: err };
    const date = clean(data.date, 20);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, error: "Please choose a preferred date." };

    const ref = makeRef("BK");
    const row = {
      service: clean(data.service, 120),
      visitType: clean(data.visitType, 60),
      time: clean(data.time, 40),
      address: clean(data.address, 300),
      notes: clean(data.notes, 2000),
    };
    await env.DB.prepare(
      `INSERT INTO bookings (ref, name, email, phone, service, visit_type, preferred_date, preferred_time, address, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(ref, name, email, phone, row.service, row.visitType, date, row.time, row.address, row.notes)
      .run();

    await notifyAdmin(
      `New booking ${ref}: ${name}`,
      [
        ["Reference", ref],
        ["Name", name],
        ["Phone", phone],
        ["Email", email],
        ["Service", row.service],
        ["Type", row.visitType],
        ["Date", date],
        ["Time", row.time],
        ["Address", row.address],
        ["Notes", row.notes],
      ],
      email || undefined,
    );
    return { ok: true, ref };
  });

// ---------- quote request ----------

export type QuoteInput = {
  name: string;
  email: string;
  phone: string;
  projectType: string;
  spaces: string[];
  size: string;
  budget: string;
  style: string;
  location: string;
  timeline: string;
  details: string;
  attachments: string[]; // URLs returned by /api/upload
  website?: string;
};

export const submitQuoteRequest = createServerFn({ method: "POST" })
  .inputValidator((d: QuoteInput) => d)
  .handler(async ({ data }): Promise<FormResult> => {
    if (clean(data.website)) return { ok: true, ref: "OK" };
    const name = clean(data.name, 120);
    const email = clean(data.email, 160);
    const phone = clean(data.phone, 40);
    const err = requireContact(name, phone, email);
    if (err) return { ok: false, error: err };

    const spaces = (Array.isArray(data.spaces) ? data.spaces : []).map((s) => clean(s, 60)).filter(Boolean).slice(0, 20);
    const attachments = (Array.isArray(data.attachments) ? data.attachments : [])
      .map((s) => clean(s, 300))
      .filter((s) => s.startsWith("/media/uploads/"))
      .slice(0, 8);
    const f = {
      projectType: clean(data.projectType, 80),
      size: clean(data.size, 80),
      budget: clean(data.budget, 80),
      style: clean(data.style, 80),
      location: clean(data.location, 200),
      timeline: clean(data.timeline, 80),
      details: clean(data.details, 4000),
    };
    if (!f.projectType && !f.details && !spaces.length) return { ok: false, error: "Please tell us a little about what you need." };

    const ref = makeRef("QR");
    await env.DB.prepare(
      `INSERT INTO quote_requests (ref, name, email, phone, project_type, spaces, size, budget, style, location, timeline, details, attachments)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(ref, name, email, phone, f.projectType, spaces.join(", "), f.size, f.budget, f.style, f.location, f.timeline, f.details, JSON.stringify(attachments))
      .run();

    await notifyAdmin(
      `New quote request ${ref}: ${name}`,
      [
        ["Reference", ref],
        ["Name", name],
        ["Phone", phone],
        ["Email", email],
        ["Project type", f.projectType],
        ["Spaces", spaces.join(", ")],
        ["Size", f.size],
        ["Budget", f.budget],
        ["Style", f.style],
        ["Location", f.location],
        ["Timeline", f.timeline],
        ["Details", f.details],
        ["Photos", attachments.length ? `${attachments.length} attached (see dashboard)` : ""],
      ],
      email || undefined,
    );
    return { ok: true, ref };
  });

// ---------- contact ----------

export type ContactInput = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  website?: string;
};

export const submitContact = createServerFn({ method: "POST" })
  .inputValidator((d: ContactInput) => d)
  .handler(async ({ data }): Promise<FormResult> => {
    if (clean(data.website)) return { ok: true, ref: "OK" };
    const name = clean(data.name, 120);
    const email = clean(data.email, 160);
    const phone = clean(data.phone, 40);
    const subject = clean(data.subject, 200);
    const message = clean(data.message, 5000);
    if (name.length < 2) return { ok: false, error: "Please enter your name." };
    if (!email && !isPhone(phone)) return { ok: false, error: "Please add an email or phone number so we can reply." };
    if (email && !isEmail(email)) return { ok: false, error: "Please enter a valid email address." };
    if (message.length < 5) return { ok: false, error: "Please write a short message." };

    const ref = makeRef("MS");
    await env.DB.prepare("INSERT INTO messages (source, name, email, phone, subject, body) VALUES ('form', ?, ?, ?, ?, ?)")
      .bind(name, email, phone, subject, message)
      .run();
    await notifyAdmin(
      `New message: ${subject || name}`,
      [
        ["Name", name],
        ["Phone", phone],
        ["Email", email],
        ["Subject", subject],
        ["Message", message],
      ],
      email || undefined,
    );
    return { ok: true, ref };
  });
