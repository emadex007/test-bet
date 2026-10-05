import { Link } from "@tanstack/react-router";
import { cn, img, useSite } from "~/lib/ui";
import { layoutOf } from "~/lib/layout";
import { SectionHeading } from "./ui";
import { ArrowRight } from "./Icons";
import type { Service } from "~/server/db";

/**
 * Services on the home page in four styles (Site settings → Layout → Services):
 *  numbered – grid of numbered tiles
 *  cards    – cards with a photo
 *  icons    – two-column list with a round marker
 *  rows     – alternating photo and text rows
 */
export function HomeServices({ services }: { services: Service[] }) {
  const s = useSite();
  const style = layoutOf(s).services;
  const home = s.home;
  const all = <Link to="/services" className="btn btn-outline shrink-0">All Services <ArrowRight size={16} /></Link>;

  return (
    <section className={cn("section", style !== "rows" && "bg-surface")}>
      <div className="container-x">
        <SectionHeading eyebrow={home.servicesEyebrow} title={home.servicesTitle} text={s.pages.servicesIntro} action={all} />

        {style === "numbered" && (
          <div className="grid gap-px overflow-hidden rounded-[var(--radius)] border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {services.map((sv, i) => (
              <Link key={sv.id} to="/services" hash={sv.slug} className="group flex flex-col bg-surface p-8 transition-colors hover:bg-bg">
                <span className="font-heading text-lg text-accent">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-6 text-3xl">{sv.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{sv.summary}</p>
                <span className="mt-6 flex items-center gap-2 text-sm font-semibold opacity-60 transition-opacity group-hover:opacity-100">
                  Learn more <ArrowRight size={14} />
                </span>
              </Link>
            ))}
          </div>
        )}

        {style === "cards" && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((sv) => (
              <Link key={sv.id} to="/services" hash={sv.slug} className="group flex flex-col overflow-hidden rounded-[var(--radius)] border border-line bg-bg transition-shadow hover:shadow-lg">
                <div className="img-zoom aspect-[4/3] max-w-full overflow-hidden bg-line">
                  {sv.image && <img src={img(sv.image, 800)} alt="" loading="lazy" className="h-full w-full object-cover" />}
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="text-2xl">{sv.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{sv.summary}</p>
                  <span className="mt-5 flex items-center gap-2 text-sm font-semibold text-accent">
                    Learn more <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {style === "icons" && (
          <div className="grid gap-x-12 gap-y-2 md:grid-cols-2">
            {services.map((sv) => (
              <Link key={sv.id} to="/services" hash={sv.slug} className="group flex items-start gap-5 border-b border-line py-6">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent/15 font-heading text-xl text-accent transition-colors group-hover:bg-accent group-hover:text-white">
                  {sv.title.trim().slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-heading text-2xl">{sv.title}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-muted">{sv.summary}</span>
                </span>
                <ArrowRight size={18} className="mt-2 shrink-0 opacity-40 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
              </Link>
            ))}
          </div>
        )}

        {style === "rows" && (
          <div className="flex flex-col gap-14 md:gap-20">
            {services.slice(0, 4).map((sv, i) => (
              <Link key={sv.id} to="/services" hash={sv.slug} className="group grid items-center gap-8 md:grid-cols-2 md:gap-14">
                <div className={cn("img-zoom aspect-[16/10] max-w-full overflow-hidden rounded-[var(--radius)] bg-line", i % 2 === 1 && "md:order-2")}>
                  {sv.image && <img src={img(sv.image, 1200)} alt="" loading="lazy" className="h-full w-full object-cover" />}
                </div>
                <div>
                  <h3 className="text-3xl md:text-4xl">{sv.title}</h3>
                  <p className="mt-3 font-heading text-lg italic text-muted">{sv.summary}</p>
                  <p className="mt-4 line-clamp-3 leading-relaxed text-muted">{sv.description}</p>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent">
                    Learn more <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
