import { img, phoneDigits, useSite, waLink, whiteLogo } from "~/lib/ui";
import { SiteLink } from "./SiteLink";
import { ClockIcon, MailIcon, PhoneIcon, PinIcon, WhatsAppIcon } from "./Icons";
import { SocialLinks } from "./SocialLinks";
import type { Service } from "~/server/db";
import { visibleLinks } from "~/lib/features";
import { layoutOf } from "~/lib/layout";
import { ClosingCta } from "./ClosingCta";

/**
 * Footer in three styles (Site settings → Layout → Footer):
 *  full   – logo and about, links, services and contact in columns
 *  simple – centred logo, one row of links, contact and social
 *  cta    – a large call-to-action band, then the simple footer
 */
export function Footer({ services }: { services?: Pick<Service, "slug" | "title">[] }) {
  const s = useSite();
  const style = layoutOf(s).footer;
  if (style === "simple") return <SimpleFooter />;
  if (style === "cta") {
    return (
      <>
        <ClosingCta />
        <SimpleFooter />
      </>
    );
  }
  return <FullFooter services={services} />;
}

function SimpleFooter() {
  const s = useSite();
  const c = s.contact;
  const logo = s.footer.showLogo ? whiteLogo(s.brand) : null;
  const logoH = Math.min(140, Math.max(20, Number(s.footer.logoHeight) || 56));
  const copyright = s.footer.copyright.replace("{year}", String(new Date().getFullYear())).replace("{name}", s.brand.name);
  return (
    <footer style={{ background: "var(--footer-bg)", color: "var(--footer-fg)" }}>
      <div className="container-x flex flex-col items-center gap-7 py-14 text-center">
        {logo ? (
          <img src={img(logo.src, 500)} alt={s.brand.name} style={{ height: logoH, ...logo.style }} className="w-auto max-w-full object-contain" />
        ) : (
          <p className="font-heading text-3xl">{s.brand.name}</p>
        )}
        {s.footer.about && <p className="max-w-xl text-sm leading-relaxed opacity-75">{s.footer.about}</p>}
        <nav className="flex flex-wrap justify-center gap-x-7 gap-y-3 text-sm" aria-label="Footer">
          {visibleLinks(s, s.header.nav).map((n) => (
            <SiteLink key={n.to + n.label} to={n.to} className="opacity-75 transition-opacity hover:opacity-100">
              {n.label}
            </SiteLink>
          ))}
        </nav>
        {s.footer.showContact && (
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm opacity-80">
            {c.phone && <a href={`tel:+${phoneDigits(c.phone)}`} className="hover:opacity-100">{c.phone}</a>}
            {c.email && <a href={`mailto:${c.email}`} className="break-all hover:opacity-100">{c.email}</a>}
            {c.whatsapp && <a href={waLink(c.whatsapp, c.whatsappMessage)} target="_blank" rel="noopener noreferrer" className="hover:opacity-100">WhatsApp</a>}
          </div>
        )}
        {s.footer.showSocial && <SocialLinks size={20} className="gap-5" />}
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center gap-2 py-6 text-center text-xs opacity-60 md:flex-row md:justify-between md:text-left">
          <p>{copyright}</p>
          <p>
            Website by{" "}
            <a href="https://emadexcreations.com.ng" target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
              Emadex Creations
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

function FullFooter({ services }: { services?: Pick<Service, "slug" | "title">[] }) {
  const s = useSite();
  const c = s.contact;
  const year = new Date().getFullYear();
  const logo = s.footer.showLogo ? whiteLogo(s.brand) : null;
  const logoH = Math.min(140, Math.max(20, Number(s.footer.logoHeight) || 56));
  const copyright = s.footer.copyright.replace("{year}", String(year)).replace("{name}", s.brand.name);

  return (
    <footer style={{ background: "var(--footer-bg)", color: "var(--footer-fg)" }}>
      <div className="container-x grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-12 lg:py-20">
        <div className="lg:col-span-4">
          {logo ? (
            <img src={img(logo.src, 500)} alt={s.brand.name} style={{ height: logoH, ...logo.style }} className="w-auto max-w-full object-contain" />
          ) : (
            <p className="font-heading text-3xl">{s.brand.name}</p>
          )}
          {s.brand.tagline && <p className="mt-1 text-sm italic opacity-70">{s.brand.tagline}</p>}
          <p className="mt-5 max-w-sm text-sm leading-relaxed opacity-75">{s.footer.about}</p>
          {s.footer.showSocial && <SocialLinks size={20} className="mt-6 gap-5" />}
        </div>

        <div className="lg:col-span-2">
          <p className="eyebrow mb-5">Explore</p>
          <ul className="space-y-3 text-sm">
            {visibleLinks(s, s.header.nav).map((n) => (
              <li key={n.to + n.label}>
                <SiteLink to={n.to} className="opacity-75 transition-opacity hover:opacity-100">
                  {n.label}
                </SiteLink>
              </li>
            ))}
            {s.features.booking && !s.header.nav.some((n) => n.to === "/book") && (
              <li>
                <SiteLink to="/book" className="opacity-75 transition-opacity hover:opacity-100">{s.labels.bookCta}</SiteLink>
              </li>
            )}
            {s.features.quotes && !s.header.nav.some((n) => n.to === "/quote") && (
              <li>
                <SiteLink to="/quote" className="opacity-75 transition-opacity hover:opacity-100">{s.labels.quoteCta}</SiteLink>
              </li>
            )}
          </ul>
        </div>

        {s.footer.showServices && s.features.services && services && services.length > 0 && (
          <div className="lg:col-span-3">
            <p className="eyebrow mb-5">Services</p>
            <ul className="space-y-3 text-sm">
              {services.slice(0, 7).map((sv) => (
                <li key={sv.slug}>
                  <SiteLink to={`/services#${sv.slug}`} className="opacity-75 transition-opacity hover:opacity-100">
                    {sv.title}
                  </SiteLink>
                </li>
              ))}
            </ul>
          </div>
        )}

        {s.footer.showContact && (
          <div className="lg:col-span-3">
            <p className="eyebrow mb-5">Contact</p>
            <ul className="space-y-4 text-sm">
              {c.address && (
                <li className="flex gap-3 opacity-80"><PinIcon size={18} className="mt-0.5 shrink-0" /> <span className="whitespace-pre-line">{c.address}</span></li>
              )}
              {c.phone && (
                <li>
                  <a href={`tel:+${phoneDigits(c.phone)}`} className="flex gap-3 opacity-80 hover:opacity-100"><PhoneIcon size={18} className="shrink-0" /> {c.phone}</a>
                </li>
              )}
              {c.whatsapp && (
                <li>
                  <a href={waLink(c.whatsapp, c.whatsappMessage)} target="_blank" rel="noopener noreferrer" className="flex gap-3 opacity-80 hover:opacity-100"><WhatsAppIcon size={18} className="shrink-0" /> WhatsApp us</a>
                </li>
              )}
              {c.email && (
                <li>
                  <a href={`mailto:${c.email}`} className="flex gap-3 break-all opacity-80 hover:opacity-100"><MailIcon size={18} className="shrink-0" /> {c.email}</a>
                </li>
              )}
              {c.hours && (
                <li className="flex gap-3 opacity-80"><ClockIcon size={18} className="shrink-0" /> {c.hours}</li>
              )}
            </ul>
          </div>
        )}
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col gap-2 py-6 text-xs opacity-60 md:flex-row md:items-center md:justify-between">
          <p>{copyright}</p>
          <p>
            Website by{" "}
            <a href="https://emadexcreations.com.ng" target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
              Emadex Creations
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
