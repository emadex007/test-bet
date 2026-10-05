import { Link } from "@tanstack/react-router";
import { img, useSite } from "~/lib/ui";

/** Photo band with the closing message and the main buttons. Also used by the "call-to-action" footer. */
export function ClosingCta() {
  const s = useSite();
  const home = s.home;
  const f = s.features;
  const L = s.labels;
  return (
    <section className="relative overflow-hidden bg-primary text-white">
      {home.ctaImage && <img src={img(home.ctaImage, 2200)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />}
      <div className="absolute inset-0 bg-black/60" />
      <div className="container-x section relative text-center">
        <h2 className="mx-auto max-w-3xl text-balance text-4xl md:text-6xl">{home.ctaTitle}</h2>
        <p className="mx-auto mt-5 max-w-xl text-white/80">{home.ctaText}</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {f.quotes && <Link to="/quote" className="btn btn-accent">{L.quoteCta}</Link>}
          {f.booking && <Link to="/book" className="btn btn-outline text-white">{L.bookCta}</Link>}
          {!f.quotes && !f.booking && <Link to="/contact" className="btn btn-accent">Contact Us</Link>}
        </div>
      </div>
    </section>
  );
}
