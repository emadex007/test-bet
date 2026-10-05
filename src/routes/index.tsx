import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { getHomeData } from "~/lib/api";
import { img, useSite } from "~/lib/ui";
import { ProjectGrid, SectionHeading } from "~/components/ui";
import { ArrowRight } from "~/components/Icons";
import { LogoMarquee, TestimonialGrid, TestimonialQuote, TestimonialSlider } from "~/components/Sliders";
import { FaqList } from "~/components/FaqList";
import { Hero } from "~/components/Hero";
import { HomeServices } from "~/components/HomeServices";
import { ClosingCta } from "~/components/ClosingCta";
import { layoutOf } from "~/lib/layout";
import type { HomeSection } from "~/lib/site-defaults";
import { PACK_HOME } from "~/lib/pack";
import { HOMES } from "~/homes";

export const Route = createFileRoute("/")({
  loader: () => getHomeData(),
  component: Home,
});

/** The industry's own home page when it has one (and it is switched on), otherwise the standard home. */
function Home() {
  const s = useSite();
  const data = Route.useLoaderData();
  const Industry = layoutOf(s).homeDesign === "industry" ? HOMES[PACK_HOME] : undefined;
  return Industry ? <Industry data={data} /> : <StandardHome />;
}

/** The banner comes first; the other sections follow the order set in Site settings → Layout. */
function StandardHome() {
  const s = useSite();
  const { services, projects, testimonials, clients, faqs } = Route.useLoaderData();
  const home = s.home;
  const f = s.features;
  const L = s.labels;
  const layout = layoutOf(s);

  const sections: Record<HomeSection, ReactNode> = {
    intro: (
      <section className="section">
        <div className="container-x grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="relative">
            <div className="aspect-[4/5] max-w-full overflow-hidden rounded-[var(--radius)] bg-line">
              {home.introImage && <img src={img(home.introImage, 1200)} alt="" loading="lazy" className="h-full w-full object-cover" />}
            </div>
            <div className="absolute -bottom-6 -right-4 hidden h-40 w-40 border border-accent md:block lg:-right-8" aria-hidden />
          </div>
          <div>
            {home.introEyebrow && <p className="eyebrow mb-5">{home.introEyebrow}</p>}
            <h2 className="text-4xl md:text-5xl">{home.introTitle}</h2>
            <p className="mt-6 whitespace-pre-line leading-relaxed text-muted">{home.introText}</p>
            {home.stats.length > 0 && (
              <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-line pt-8">
                {home.stats.map((st) => (
                  <div key={st.label}>
                    <dt className="font-heading text-4xl text-accent md:text-5xl">{st.value}</dt>
                    <dd className="mt-1 text-xs uppercase tracking-wider text-muted">{st.label}</dd>
                  </div>
                ))}
              </dl>
            )}
            <div className="mt-10 flex flex-wrap gap-3">
              <Link to="/about" className="btn btn-primary">About Us</Link>
              {f.booking && <Link to="/book" className="btn btn-outline">{L.bookCta}</Link>}
            </div>
          </div>
        </div>
      </section>
    ),

    services: home.showServices && f.services && services.length > 0 && <HomeServices services={services} />,

    projects: home.showProjects && f.portfolio && projects.length > 0 && (
      <section className="section">
        <div className="container-x">
          <SectionHeading
            eyebrow={home.projectsEyebrow}
            title={home.projectsTitle}
            text={home.projectsText}
            action={<Link to="/portfolio" className="btn btn-outline shrink-0">View All {L.items} <ArrowRight size={16} /></Link>}
          />
          <ProjectGrid items={projects} />
        </div>
      </section>
    ),

    process: home.showProcess && home.process.length > 0 && (
      <section className="section bg-primary text-on-primary">
        <div className="container-x">
          <div className="mb-14 max-w-2xl">
            {home.processEyebrow && <p className="eyebrow mb-4">{home.processEyebrow}</p>}
            <h2 className="text-4xl md:text-5xl">{home.processTitle}</h2>
          </div>
          <ol className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {home.process.map((step, i) => (
              <li key={step.title} className="border-t border-white/20 pt-6">
                <span className="font-heading text-5xl text-accent">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-4 text-2xl">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed opacity-75">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    ),

    // Hidden until logos are added in the dashboard.
    clients: home.showClients && f.clients && clients.length > 0 && (
      <section className="border-y border-line bg-surface py-12 md:py-16">
        <div className="container-x">
          <p className="eyebrow mb-8 text-center">{home.clientsTitle}</p>
        </div>
        <LogoMarquee items={clients} />
      </section>
    ),

    // Hidden until at least one testimonial is switched on in the dashboard.
    testimonials: home.showTestimonials && f.testimonials && testimonials.length > 0 && (
      <section className="section">
        <div className="container-x">
          {layout.testimonials !== "quote" && <SectionHeading eyebrow="Kind words" title={home.testimonialsTitle} align="center" />}
          {layout.testimonials === "grid" ? (
            <TestimonialGrid items={testimonials} />
          ) : layout.testimonials === "quote" ? (
            <TestimonialQuote items={testimonials} seconds={Number(home.sliderSeconds) || 6} />
          ) : (
            <div className="-mx-3">
              <TestimonialSlider items={testimonials} seconds={Number(home.sliderSeconds) || 6} />
            </div>
          )}
        </div>
      </section>
    ),

    faq: home.showFaq && f.faqs && faqs.length > 0 && (
      <section className="section bg-surface">
        <div className="container-x grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="eyebrow mb-4">Good to know</p>
            <h2 className="text-4xl md:text-5xl">{home.faqTitle}</h2>
            <p className="mt-4 text-muted">Can't find your answer? Ask us on the chat or send us a message.</p>
            <Link to="/contact" className="btn btn-outline mt-6">Contact us</Link>
          </div>
          <div className="lg:col-span-8">
            <FaqList items={faqs} />
          </div>
        </div>
      </section>
    ),

    // The "call-to-action" footer already ends every page with this, so it isn't repeated.
    cta: home.showCta && layout.footer !== "cta" && <ClosingCta />,
  };

  return (
    <>
      <Hero />
      {layout.homeOrder.map((key) => (sections[key] ? <div key={key} className="contents">{sections[key]}</div> : null))}
    </>
  );
}
