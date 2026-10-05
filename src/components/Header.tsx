import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { cn, img, phoneDigits, useSite, waLink, whiteLogo } from "~/lib/ui";
import { SiteLink } from "./SiteLink";
import { CloseIcon, MenuIcon, PhoneIcon, WhatsAppIcon } from "./Icons";
import { SocialLinks } from "./SocialLinks";
import { pathOn, visibleLinks } from "~/lib/features";
import { heroUnderHeader, layoutOf } from "~/lib/layout";

/**
 * Site header in four styles (Site settings → Layout → Header):
 *  classic  – logo left, menu right
 *  centered – logo in the middle, menu on its own row below (desktop)
 *  minimal  – logo and a Menu button that opens a full-screen menu
 *  bold     – solid bar in the main colour with uppercase menu
 */
export function Header() {
  const s = useSite();
  const style = layoutOf(s).header;
  const pathname = useRouterState({ select: (st) => st.location.pathname });
  const isHome = pathname === "/";
  // See-through only over a photo banner, and never for the bold bar.
  const overlay = isHome && s.header.transparentOnHome && heroUnderHeader(s) && style !== "bold";
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  const solid = !overlay || scrolled || open;
  const bold = style === "bold";
  const white = whiteLogo(s.brand);
  // Over a photo or on the bold bar use the white logo; otherwise the normal one.
  const logo = (!solid || bold) && white ? white : s.brand.logoUrl ? { src: s.brand.logoUrl, style: undefined } : null;
  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(to + "/"));
  const nav = visibleLinks(s, s.header.nav);
  const showCta = !!s.header.cta.label && pathOn(s, s.header.cta.to);

  const bg = bold ? "var(--c-primary)" : solid ? "var(--header-bg)" : "transparent";
  const fg = bold ? "var(--c-on-primary)" : solid ? "var(--header-fg)" : "#fff";

  const brand = (
    <SiteLink to="/" className={cn("flex min-w-0 items-center gap-3", style === "centered" && "lg:justify-center")}>
      {logo ? (
        <img src={img(logo.src, 400)} alt={s.brand.name} style={{ height: "var(--logo-h)", ...logo.style }} className="w-auto object-contain transition-[filter] duration-300" />
      ) : (
        <span className={cn("flex flex-col leading-none", style === "centered" && "lg:items-center")}>
          <span className={cn("font-heading text-2xl font-semibold tracking-tight md:text-[1.7rem]", bold && "uppercase tracking-wide")}>{s.brand.name}</span>
          {s.header.showTagline && s.brand.tagline && <span className="mt-1 text-[0.68rem] italic tracking-wide opacity-75">{s.brand.tagline}</span>}
        </span>
      )}
    </SiteLink>
  );

  const navLinks = (cls: string) =>
    nav.map((n) => (
      <SiteLink
        key={n.to + n.label}
        to={n.to}
        className={cn(cls, "relative font-medium transition-opacity hover:opacity-100", isActive(n.to) ? "opacity-100" : "opacity-75", bold && "text-xs uppercase tracking-[0.14em]")}
      >
        {n.label}
        {isActive(n.to) && <span className="absolute -bottom-1.5 left-0 h-px w-full bg-accent" />}
      </SiteLink>
    ));

  const cta = (className = "") =>
    showCta && (
      <SiteLink to={s.header.cta.to} className={cn("btn hidden sm:inline-flex", bold ? "btn-accent" : solid ? "btn-primary" : "btn-outline", className)}>
        {s.header.cta.label}
      </SiteLink>
    );

  const menuButton = (always: boolean) => (
    <button
      type="button"
      aria-label={open ? "Close menu" : "Open menu"}
      aria-expanded={open}
      onClick={() => setOpen((v) => !v)}
      className={cn("-mr-2 flex items-center gap-2 p-2", !always && "lg:hidden")}
    >
      {always && <span className="hidden text-sm font-semibold uppercase tracking-[0.14em] sm:inline">{open ? "Close" : "Menu"}</span>}
      {open ? <CloseIcon size={26} /> : <MenuIcon size={26} />}
    </button>
  );

  return (
    <>
      {s.topBar.show && (
        <div style={{ background: "var(--topbar-bg)", color: "var(--topbar-fg)" }} className="text-xs">
          <div className="container-x flex items-center justify-between gap-4 py-2">
            <p className="truncate">{s.topBar.text}</p>
            <div className="hidden items-center gap-5 md:flex">
              {s.contact.phone && (
                <a href={`tel:+${phoneDigits(s.contact.phone)}`} className="flex items-center gap-1.5 hover:opacity-80">
                  <PhoneIcon size={14} /> {s.contact.phone}
                </a>
              )}
              <SocialLinks size={14} className="gap-3" />
            </div>
          </div>
        </div>
      )}

      <header
        className={cn("z-40 w-full transition-[background-color,box-shadow,color] duration-300", s.header.sticky ? "sticky top-0" : "relative", overlay && "-mb-[var(--header-h)]")}
        style={{
          height: "var(--header-h)",
          background: bg,
          color: fg,
          boxShadow: solid && scrolled && !bold ? "0 1px 0 var(--c-border)" : "none",
        }}
      >
        {style === "centered" ? (
          <div className="container-x flex h-full flex-col">
            <div className="flex flex-1 items-center justify-between gap-6 lg:grid lg:grid-cols-[1fr_auto_1fr]">
              <div className="hidden items-center gap-4 text-sm lg:flex">
                {s.contact.phone && (
                  <a href={`tel:+${phoneDigits(s.contact.phone)}`} className="flex items-center gap-1.5 opacity-75 hover:opacity-100">
                    <PhoneIcon size={15} /> {s.contact.phone}
                  </a>
                )}
              </div>
              {brand}
              <div className="flex items-center justify-end gap-3">
                {cta()}
                {menuButton(false)}
              </div>
            </div>
            <nav className="hidden h-[52px] items-center justify-center gap-9 border-t text-sm tracking-wide lg:flex" style={{ borderColor: "color-mix(in srgb, currentColor 15%, transparent)" }}>{navLinks("")}</nav>
          </div>
        ) : (
          <div className="container-x flex h-full items-center justify-between gap-6">
            {brand}
            {style !== "minimal" && <nav className="hidden items-center gap-8 text-sm tracking-wide lg:flex">{navLinks("")}</nav>}
            <div className="flex items-center gap-3">
              {cta()}
              {menuButton(style === "minimal")}
            </div>
          </div>
        )}

        {/* Menu panel: phones for every style, all screens for the minimal style */}
        <div
          className={cn(
            "fixed inset-x-0 bottom-0 z-40 overflow-y-auto bg-bg text-ink transition-opacity duration-300",
            style !== "minimal" && "lg:hidden",
            open ? "opacity-100" : "pointer-events-none opacity-0",
          )}
          style={{ top: "var(--header-h)" }}
        >
          <nav className={cn("container-x flex flex-col py-6", style === "minimal" && "lg:py-14")}>
            {nav.map((n) => (
              <SiteLink
                key={n.to + n.label}
                to={n.to}
                onClick={() => setOpen(false)}
                className={cn("border-b border-line py-4 font-heading text-3xl", style === "minimal" && "lg:py-6 lg:text-6xl", isActive(n.to) && "text-accent")}
              >
                {n.label}
              </SiteLink>
            ))}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {showCta && (
                <SiteLink to={s.header.cta.to} onClick={() => setOpen(false)} className="btn btn-primary">
                  {s.header.cta.label}
                </SiteLink>
              )}
              {s.contact.whatsapp && (
                <a href={waLink(s.contact.whatsapp, s.contact.whatsappMessage)} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                  <WhatsAppIcon /> Chat on WhatsApp
                </a>
              )}
            </div>
            <SocialLinks size={20} className="mt-8 gap-5 text-muted" />
          </nav>
        </div>
      </header>
    </>
  );
}
