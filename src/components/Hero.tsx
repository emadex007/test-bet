import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { cn, img, useSite } from "~/lib/ui";
import { pathOn } from "~/lib/features";
import { layoutOf } from "~/lib/layout";
import { SiteLink } from "./SiteLink";
import { ArrowRight, SearchIcon } from "./Icons";

/**
 * Home page banner in four styles (Site settings → Layout → Home banner):
 *  full     – photo fills the banner, text on top
 *  slider   – like full, cross-fading between up to three photos
 *  split    – text on one side, photo on the other
 *  centered – centred text on the main colour, photo below overlapping the next section
 */
export function Hero() {
  const s = useSite();
  const style = layoutOf(s).hero;
  if (style === "split") return <SplitHero />;
  if (style === "centered") return <CenteredHero />;
  return <PhotoHero slider={style === "slider"} />;
}

function HeroText({ tone, size = "xl" }: { tone: "light" | "dark"; size?: "xl" | "lg" }) {
  const s = useSite();
  const h = s.hero;
  const center = h.align === "center";
  const onDark = tone === "light";
  return (
    <>
      {h.eyebrow && <p className={cn("eyebrow fade-up mb-6", onDark && "!text-[color-mix(in_srgb,var(--c-accent)_60%,white)]")}>{h.eyebrow}</p>}
      <h1
        className={cn(
          "fade-up max-w-4xl leading-[1.02] text-balance",
          size === "xl" ? "text-5xl sm:text-6xl md:text-7xl lg:text-8xl" : "text-5xl md:text-6xl lg:text-7xl",
          center && "mx-auto",
        )}
      >
        {h.title}
      </h1>
      {h.subtitle && <p className={cn("fade-up-2 mt-7 max-w-xl text-base leading-relaxed md:text-lg", onDark ? "text-white/85" : "text-muted", center && "mx-auto")}>{h.subtitle}</p>}
      <div className={cn("fade-up-3 mt-10 flex flex-wrap gap-3", center && "justify-center")}>
        {h.primaryCta.label && pathOn(s, h.primaryCta.to) && (
          <SiteLink to={h.primaryCta.to} className={cn("btn", onDark ? "btn-accent" : "btn-primary")}>
            {h.primaryCta.label} <ArrowRight size={16} />
          </SiteLink>
        )}
        {h.secondaryCta.label && pathOn(s, h.secondaryCta.to) && (
          <SiteLink to={h.secondaryCta.to} className={cn("btn btn-outline", onDark && "text-white")}>
            {h.secondaryCta.label}
          </SiteLink>
        )}
      </div>
      {s.features.listings && s.features.portfolio ? (
        <HeroSearch center={center} tone={tone} />
      ) : (
        s.brand.tagline && <p className={cn("fade-up-3 mt-14 font-heading text-xl italic md:text-2xl", onDark ? "text-white/70" : "text-muted", center && "mx-auto")}>{s.brand.tagline}</p>
      )}
    </>
  );
}

function PhotoHero({ slider }: { slider: boolean }) {
  const s = useSite();
  const h = s.hero;
  const overlay = Math.min(0.9, Math.max(0, Number(h.overlay) || 0));
  const photos = (slider ? [h.image, h.slide2, h.slide3] : [h.image]).filter(Boolean);
  const [i, setI] = useState(0);
  useEffect(() => {
    if (photos.length < 2 || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((x) => (x + 1) % photos.length), 6000);
    return () => clearInterval(t);
  }, [photos.length]);

  return (
    <section
      className="relative flex items-center overflow-hidden bg-primary text-white"
      style={{ minHeight: `max(560px, ${Math.min(100, Math.max(40, Number(h.height) || 90))}vh)` }}
    >
      {photos.map((p, n) => (
        <img
          key={p + n}
          src={img(p, 2400)}
          alt=""
          className="hero-slide absolute inset-0 h-full w-full object-cover"
          style={{ opacity: n === i ? 1 : 0 }}
          fetchPriority={n === 0 ? "high" : "low"}
          loading={n === 0 ? "eager" : "lazy"}
        />
      ))}
      {h.video && <VideoBackground src={h.video} />}
      <div className="absolute inset-0" style={{ background: `rgba(0,0,0,${overlay})` }} />
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
      <div className={cn("container-x relative pb-20 pt-[calc(var(--header-h)+3rem)]", h.align === "center" && "text-center")}>
        <HeroText tone="light" />
      </div>
      {photos.length > 1 && (
        <div className="absolute inset-x-0 bottom-6 flex justify-center gap-2">
          {photos.map((_, n) => (
            <button
              key={n}
              type="button"
              onClick={() => setI(n)}
              aria-label={`Show photo ${n + 1}`}
              aria-current={n === i}
              className={cn("h-1.5 rounded-full transition-all", n === i ? "w-8 bg-white" : "w-3 bg-white/50 hover:bg-white/80")}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function SplitHero() {
  const s = useSite();
  const h = s.hero;
  return (
    <section className="relative overflow-hidden">
      <div className="container-x grid items-center gap-12 py-14 md:py-20 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:py-24">
        <div className={cn(h.align === "center" && "text-center")}>
          <HeroText tone="dark" size="lg" />
        </div>
        <div className="relative">
          <div className="absolute -bottom-5 -left-5 hidden h-2/3 w-2/3 rounded-[var(--radius)] bg-accent/20 lg:block" aria-hidden />
          <div className="relative aspect-[4/5] max-w-full overflow-hidden rounded-[var(--radius)] bg-line sm:aspect-[5/4] lg:aspect-[4/5]">
            {h.image && <img src={img(h.image, 1600)} alt="" className="h-full w-full object-cover" fetchPriority="high" />}
          </div>
        </div>
      </div>
    </section>
  );
}

function CenteredHero() {
  const s = useSite();
  const h = s.hero;
  return (
    <section className="relative">
      <div className="bg-primary text-on-primary">
        <div className="container-x pb-36 pt-16 text-center md:pb-48 md:pt-24 [&_.eyebrow]:!text-[color-mix(in_srgb,var(--c-accent)_70%,white)]">
          <div className="mx-auto max-w-4xl [&_h1]:mx-auto [&_p]:mx-auto [&>div]:justify-center">
            <HeroTextCentered />
          </div>
        </div>
      </div>
      {h.image && (
        <div className="container-x relative -mt-28 md:-mt-36">
          <div className="aspect-[16/10] max-w-full overflow-hidden rounded-[var(--radius)] bg-line shadow-2xl md:aspect-[21/9]">
            <img src={img(h.image, 2200)} alt="" className="h-full w-full object-cover" fetchPriority="high" />
          </div>
        </div>
      )}
    </section>
  );
}

/** Text for the centred banner: always centred, on the main colour. */
function HeroTextCentered() {
  const s = useSite();
  const h = s.hero;
  return (
    <>
      {h.eyebrow && <p className="eyebrow fade-up mb-6">{h.eyebrow}</p>}
      <h1 className="fade-up max-w-4xl text-balance text-5xl leading-[1.02] sm:text-6xl md:text-7xl">{h.title}</h1>
      {h.subtitle && <p className="fade-up-2 mt-7 max-w-xl text-base leading-relaxed opacity-80 md:text-lg">{h.subtitle}</p>}
      <div className="fade-up-3 mt-10 flex flex-wrap justify-center gap-3">
        {h.primaryCta.label && pathOn(s, h.primaryCta.to) && (
          <SiteLink to={h.primaryCta.to} className="btn btn-accent">
            {h.primaryCta.label} <ArrowRight size={16} />
          </SiteLink>
        )}
        {h.secondaryCta.label && pathOn(s, h.secondaryCta.to) && (
          <SiteLink to={h.secondaryCta.to} className="btn btn-outline">
            {h.secondaryCta.label}
          </SiteLink>
        )}
      </div>
      {s.features.listings && s.features.portfolio && <HeroSearch center tone="light" />}
    </>
  );
}

/** Property search on the home banner (real estate). Opens the listings page with the filters filled in. */
function HeroSearch({ center, tone }: { center: boolean; tone: "light" | "dark" }) {
  const s = useSite();
  const navigate = useNavigate();
  const [type, setType] = useState("");
  const [ptype, setPtype] = useState("");
  const [q, setQ] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    navigate({ to: "/portfolio", search: { type: type || undefined, ptype: ptype || undefined, q: q.trim() || undefined } });
  };
  const field = cn(
    "h-12 w-full rounded-[var(--radius)] px-3 text-sm text-ink outline-none focus:ring-2 focus:ring-accent",
    tone === "light" ? "border-0 bg-white" : "border border-line bg-surface",
  );
  return (
    <form
      onSubmit={submit}
      className={cn(
        "fade-up-3 mt-12 grid max-w-4xl gap-2 rounded-[calc(var(--radius)+4px)] p-2 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.4fr_auto]",
        tone === "light" ? "bg-white/15 backdrop-blur-md" : "border border-line bg-bg",
        center && "mx-auto",
      )}
    >
      <select aria-label="Buy or rent" value={type} onChange={(e) => setType(e.target.value)} className={field}>
        <option value="">Buy or rent</option>
        {s.listing.types.map((t) => (
          <option key={t}>{t}</option>
        ))}
      </select>
      <select aria-label="Property type" value={ptype} onChange={(e) => setPtype(e.target.value)} className={field}>
        <option value="">Any property type</option>
        {s.listing.propertyTypes.map((t) => (
          <option key={t}>{t}</option>
        ))}
      </select>
      <input aria-label="Area or keyword" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Area, estate or keyword" className={cn(field, "sm:col-span-2 lg:col-span-1")} />
      <button type="submit" className="btn btn-accent h-12 sm:col-span-2 lg:col-span-1">
        <SearchIcon size={18} /> Search
      </button>
    </form>
  );
}

/** YouTube video id from a watch, short or embed link. */
export function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/))([\w-]{11})/);
  return m ? m[1] : null;
}

/**
 * Muted, looping background video behind banner text: an .mp4 link or a YouTube link.
 * Skipped for visitors who ask for reduced motion; the photo underneath shows instead.
 */
export function VideoBackground({ src }: { src: string }) {
  const [ok, setOk] = useState(false);
  useEffect(() => setOk(!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches), []);
  if (!ok) return null;
  const yt = youtubeId(src);
  if (yt) {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <iframe
          title="Background video"
          src={`https://www.youtube-nocookie.com/embed/${yt}?autoplay=1&mute=1&loop=1&playlist=${yt}&controls=0&showinfo=0&modestbranding=1&playsinline=1&rel=0`}
          allow="autoplay; encrypted-media"
          className="absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-[177.78vh] min-w-full -translate-x-1/2 -translate-y-1/2"
        />
      </div>
    );
  }
  return <video className="absolute inset-0 h-full w-full object-cover" src={src} autoPlay muted loop playsInline aria-hidden />;
}
