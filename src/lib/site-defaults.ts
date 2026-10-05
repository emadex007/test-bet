// Every editable part of the website lives here.
// The admin dashboard saves overrides to the `settings` table, one JSON blob per section.
// Anything not saved falls back to these defaults, so the site always renders.
//
// The defaults are built in three layers:
//   1. BASE_DEFAULTS below: neutral text for any service business.
//   2. The industry pack (src/packs/active.ts): text, form options and switches for one kind of business.
//   3. The client details (src/business.ts): fills {{business}}, {{short}}, {{email}} … in the text.
// `npm run new-client` sets layers 2 and 3, so this file never needs editing per client.

import { CLIENT } from "~/business";
import PACK from "~/packs/active";

export type NavItem = { label: string; to: string };
export type Cta = { label: string; to: string };

export type SiteSettings = {
  brand: {
    name: string;
    tagline: string;
    logoUrl: string; // leave empty to show the name as text
    logoWhiteUrl: string; // optional white version, used over photos and in the footer
    autoWhiteLogo: boolean; // if no white version is uploaded, turn the normal logo white automatically
    faviconUrl: string;
  };
  theme: {
    primary: string; // buttons, highlights
    onPrimary: string; // text on primary buttons
    accent: string; // gold details, small labels
    background: string; // page background
    surface: string; // cards, forms
    text: string;
    muted: string;
    border: string;
    headingFont: string; // any Google Font name
    bodyFont: string;
    baseFontSize: number; // px
    radius: number; // px, corner roundness
    containerWidth: number; // px, max content width
    sectionSpacing: number; // px, vertical space between sections
  };
  topBar: {
    show: boolean;
    text: string;
    background: string;
    textColor: string;
  };
  header: {
    height: number; // px
    logoHeight: number; // px
    background: string;
    textColor: string;
    sticky: boolean;
    transparentOnHome: boolean; // sits over the hero image on the home page
    showTagline: boolean;
    nav: NavItem[];
    cta: Cta;
  };
  hero: {
    height: number; // % of screen height (vh)
    image: string;
    overlay: number; // 0 to 0.9 darkness over the image
    eyebrow: string;
    title: string;
    subtitle: string;
    primaryCta: Cta;
    secondaryCta: Cta;
    align: "left" | "center";
    slide2: string; // extra photos for the "slider" banner style
    slide3: string;
    video: string; // optional background video: an .mp4 link or a YouTube link
  };
  home: {
    introEyebrow: string;
    introTitle: string;
    introText: string;
    introImage: string;
    stats: { value: string; label: string }[];
    showServices: boolean;
    servicesEyebrow: string;
    servicesTitle: string;
    showProjects: boolean;
    projectsEyebrow: string;
    projectsTitle: string;
    projectsText: string;
    showProcess: boolean;
    processEyebrow: string;
    processTitle: string;
    showTestimonials: boolean;
    testimonialsTitle: string;
    sliderSeconds: number; // how long each testimonial shows before sliding
    showClients: boolean;
    clientsTitle: string;
    showFaq: boolean;
    faqTitle: string;
    showCta: boolean;
    process: { title: string; text: string }[];
    ctaTitle: string;
    ctaText: string;
    ctaImage: string;
  };
  about: {
    heroImage: string;
    title: string;
    intro: string;
    story: string;
    image: string;
    values: { title: string; text: string }[];
  };
  pages: {
    portfolioTitle: string;
    portfolioIntro: string;
    portfolioImage: string;
    servicesTitle: string;
    servicesIntro: string;
    servicesImage: string;
    bookTitle: string;
    bookIntro: string;
    quoteTitle: string;
    quoteIntro: string;
    contactTitle: string;
    contactIntro: string;
    contactShowFaq: boolean;
    formsImage: string;
  };
  contact: {
    phone: string;
    whatsapp: string; // number used for the WhatsApp button
    whatsappMessage: string;
    showWhatsappButton: boolean;
    email: string;
    address: string;
    hours: string;
    mapEmbedUrl: string; // Google Maps "Embed a map" src URL
  };
  social: {
    instagram: string;
    facebook: string;
    tiktok: string;
    x: string;
    linkedin: string;
    youtube: string;
    pinterest: string;
  };
  footer: {
    background: string;
    textColor: string;
    about: string;
    showServices: boolean;
    showContact: boolean;
    showSocial: boolean;
    showLogo: boolean; // show the (white) logo instead of the name
    logoHeight: number; // px
    copyright: string; // {year} and {name} are replaced
  };
  seo: {
    title: string;
    description: string;
    ogImage: string;
  };
  quotes: {
    numberPrefix: string; // e.g. JP-Q → JP-Q-0001
    validDays: number; // default validity for new quotations
    intro: string; // shown above the items
    notes: string; // default notes on new quotations
    terms: string; // shown at the bottom of every quotation
    acceptMessage: string; // shown to the client after accepting
  };
  chat: {
    enabled: boolean;
    title: string;
    greeting: string; // first message visitors see
    offlineMessage: string; // shown when no staff has been active recently
    buttonLabel: string;
  };
  /** Switch whole parts of the site on or off. Off hides the page, its menu links, buttons and dashboard menu item. */
  features: {
    services: boolean;
    portfolio: boolean;
    booking: boolean;
    quotes: boolean; // the public request form and the quotation builder
    faqs: boolean;
    testimonials: boolean;
    clients: boolean;
    listings: boolean; // property listings: price, bedrooms, sale/rent, filters
  };
  /** Words used around the site, so a portfolio can be "Projects", "Properties", "Cakes"… */
  labels: {
    item: string; // one item in the portfolio, e.g. "Project"
    items: string; // e.g. "Projects"
    portfolioEyebrow: string;
    aboutItem: string; // heading above an item's description
    bookCta: string; // buttons that go to /book
    quoteCta: string; // buttons that go to /quote
    similarCta: string; // on an item page, button to /quote
    askCta: string; // on an item page, WhatsApp button
    askMessage: string; // WhatsApp text; {item} is the item's title
  };
  /** Questions on the request (/quote) and booking (/book) forms. An empty option list hides that question. */
  forms: {
    quoteEyebrow: string;
    quoteStep: string;
    typeLabel: string;
    types: string[];
    multiLabel: string;
    multi: string[];
    styleLabel: string;
    styles: string[];
    sizeLabel: string;
    sizePlaceholder: string;
    locationLabel: string;
    budgetLabel: string;
    budgets: string[];
    timelineLabel: string;
    timelines: string[];
    detailsLabel: string;
    detailsPlaceholder: string;
    showPhotos: boolean;
    photosLabel: string;
    photosHint: string;
    quoteSubmit: string;
    quoteFootnote: string;
    quoteSuccessTitle: string;
    quoteSuccessText: string;
    bookingEyebrow: string;
    bookingServiceLabel: string;
    bookingTypes: string[];
    bookingTimes: string[];
    addressFor: string; // the appointment type that asks for an address, e.g. "Site visit"
    addressLabel: string;
    notesLabel: string;
    notesPlaceholder: string;
    bookingSubmit: string;
  };
  /** How the site is laid out. Each section has several styles; packs pick a combination, the dashboard can change it. */
  layout: {
    homeDesign: "industry" | "standard"; // the industry's own home page, or the standard one
    feel: LayoutFeel;
    header: "classic" | "centered" | "minimal" | "bold";
    hero: "full" | "split" | "centered" | "slider";
    services: "numbered" | "cards" | "icons" | "rows";
    cards: "overlay" | "below" | "masonry";
    testimonials: "slider" | "grid" | "quote";
    footer: "full" | "simple" | "cta";
    homeOrder: HomeSection[];
  };
  /** Betting and trading sites: run the demo (fake money) or send visitors to the client's real licensed platform. */
  platform: {
    mode: "demo" | "link";
    url: string; // the client's real platform, used in link mode
    label: string; // e.g. "Bet now on our app"
    currency: string;
    demoBalance: number; // starting fake balance in demo mode
    usdRate: number; // naira per dollar, for crypto prices shown in naira
    demoNote: string;
  };
  /** Used when features.listings is on. */
  listing: {
    currency: string;
    types: string[]; // For Sale, For Rent…
    propertyTypes: string[];
    statuses: string[]; // the first one counts as "available"
    showFilters: boolean;
  };
};

export type LayoutFeel = "elegant" | "bold" | "modern" | "playful" | "minimal";
export type HomeSection = "intro" | "services" | "projects" | "process" | "clients" | "testimonials" | "faq" | "cta";
export const HOME_SECTIONS: { key: HomeSection; label: string }[] = [
  { key: "intro", label: "Welcome section" },
  { key: "services", label: "Services" },
  { key: "projects", label: "Featured items (portfolio / properties)" },
  { key: "process", label: "How we work steps" },
  { key: "clients", label: "Clients & partners logos" },
  { key: "testimonials", label: "Testimonials" },
  { key: "faq", label: "FAQs" },
  { key: "cta", label: "Closing call-to-action" },
];

/** Section-by-section partial settings, used by industry packs. */
export type SettingsOverrides = { [K in keyof SiteSettings]?: Partial<SiteSettings[K]> };

const U = (id: string, w = 1600) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

/** Neutral defaults for any service business. Packs override what their industry needs. */
export const BASE_DEFAULTS: SiteSettings = {
  brand: {
    name: "{{business}}",
    tagline: "{{tagline}}",
    logoUrl: "",
    logoWhiteUrl: "",
    autoWhiteLogo: true,
    faviconUrl: "",
  },
  theme: {
    primary: "#14213D",
    onPrimary: "#FFFFFF",
    accent: "#C9A227",
    background: "#F7F7F5",
    surface: "#FFFFFF",
    text: "#1A1A1A",
    muted: "#5F6470",
    border: "#E3E3DE",
    headingFont: "DM Serif Display",
    bodyFont: "DM Sans",
    baseFontSize: 16,
    radius: 6,
    containerWidth: 1200,
    sectionSpacing: 96,
  },
  topBar: {
    show: true,
    text: "Call or WhatsApp us today. We reply fast.",
    background: "#14213D",
    textColor: "#E9E4D4",
  },
  header: {
    height: 84,
    logoHeight: 44,
    background: "#FFFFFF",
    textColor: "#14213D",
    sticky: true,
    transparentOnHome: true,
    showTagline: true,
    nav: [
      { label: "Home", to: "/" },
      { label: "About", to: "/about" },
      { label: "Services", to: "/services" },
      { label: "Our Work", to: "/portfolio" },
      { label: "Contact", to: "/contact" },
    ],
    cta: { label: "Get a Quote", to: "/quote" },
  },
  hero: {
    height: 88,
    image: U("1497366216548-37526070297c", 2200),
    overlay: 0.5,
    eyebrow: "Welcome to {{short}}",
    title: "Professional service you can count on",
    subtitle: "{{business}} delivers quality work on time, with clear pricing and a team that keeps you updated from start to finish.",
    primaryCta: { label: "Our Services", to: "/services" },
    secondaryCta: { label: "Book a Consultation", to: "/book" },
    align: "left",
    slide2: U("1552664730-d307ca884978", 2200),
    slide3: U("1521737604893-d14cc237f11d", 2200),
    video: "",
  },
  home: {
    introEyebrow: "About {{short}}",
    introTitle: "A team that listens first, then delivers.",
    introText:
      "{{business}} helps individuals and businesses get things done properly. We take time to understand what you need, give you a clear plan and price, and see the work through to the end.",
    introImage: U("1552664730-d307ca884978", 1400),
    // Add real numbers from the dashboard, e.g. { value: "50+", label: "Happy clients" }. Hidden while empty.
    stats: [],
    showServices: true,
    servicesEyebrow: "What we do",
    servicesTitle: "Our Services",
    showProjects: true,
    projectsEyebrow: "Our work",
    projectsTitle: "Recent Work",
    projectsText: "A few examples of what we've delivered. Click any one to see the full gallery.",
    showProcess: true,
    processEyebrow: "How we work",
    processTitle: "A simple process, from first call to finished job",
    showTestimonials: true,
    testimonialsTitle: "What our clients say",
    sliderSeconds: 6,
    showClients: true,
    clientsTitle: "Clients & partners we've worked with",
    showFaq: true,
    faqTitle: "Frequently asked questions",
    showCta: true,
    process: [
      { title: "Talk to us", text: "Call, chat or send a request and tell us what you need." },
      { title: "Plan & price", text: "We agree the details and send you a clear quotation." },
      { title: "We deliver", text: "Our team gets to work and keeps you updated at every stage." },
      { title: "Follow-up", text: "We check you're happy and stay available after the job." },
    ],
    ctaTitle: "Ready to get started?",
    ctaText: "Tell us what you need and we'll get back to you with a plan and a free quote.",
    ctaImage: U("1497215728101-856f4ea42174", 2000),
  },
  about: {
    heroImage: U("1521737604893-d14cc237f11d", 2200),
    title: "About {{business}}",
    intro: "Who we are, what we do and how we work.",
    story:
      "{{business}} was started to give clients a better experience: honest advice, fair prices and work done right the first time.\n\nWe work closely with every client, keep you informed at each stage and take pride in delivering on time. Whatever the size of the job, we treat it like our own.",
    image: U("1556761175-5973dc0f32e7", 1400),
    values: [
      { title: "Quality work", text: "We do things properly, with attention to detail." },
      { title: "Honest pricing", text: "Clear quotations with no hidden costs." },
      { title: "On time", text: "We plan carefully and keep our promises." },
      { title: "Here for you", text: "Easy to reach before, during and after the job." },
    ],
  },
  pages: {
    portfolioTitle: "Our Work",
    portfolioIntro: "A selection of jobs we've completed for our clients.",
    portfolioImage: U("1497366811353-6870744d04b2", 2200),
    servicesTitle: "Our Services",
    servicesIntro: "Everything we offer, handled by one dependable team.",
    servicesImage: U("1497215728101-856f4ea42174", 2200),
    bookTitle: "Book a Consultation",
    bookIntro: "Choose a day that suits you and we'll confirm your appointment.",
    quoteTitle: "Request a Quote",
    quoteIntro: "Tell us what you need. The more detail you share, the more accurate our quotation will be.",
    contactTitle: "Contact Us",
    contactIntro: "Call, WhatsApp, email or send us a message. We'll get back to you as soon as possible.",
    contactShowFaq: true,
    formsImage: U("1497366216548-37526070297c", 2200),
  },
  contact: {
    phone: "{{phone}}",
    whatsapp: "{{phone}}",
    whatsappMessage: "Hello {{business}}, I'd like to make an enquiry.",
    showWhatsappButton: true,
    email: "{{email}}",
    address: "Your office address, {{city}}, Nigeria",
    hours: "Mon to Sat, 9:00am to 6:00pm",
    mapEmbedUrl: "",
  },
  social: {
    instagram: "",
    facebook: "",
    tiktok: "",
    x: "",
    linkedin: "",
    youtube: "",
    pinterest: "",
  },
  footer: {
    background: "#14213D",
    textColor: "#E3E6EE",
    about: "{{business}}: quality service, honest pricing and a team you can reach when you need us.",
    showServices: true,
    showContact: true,
    showSocial: true,
    showLogo: true,
    logoHeight: 56,
    copyright: "© {year} {name}. All rights reserved.",
  },
  seo: {
    title: "{{business}} | {{tagline}}",
    description: "{{business}} in {{city}}. See our services and work, book a consultation or request a free quote.",
    ogImage: U("1497366216548-37526070297c", 1200),
  },
  quotes: {
    numberPrefix: "{{quotePrefix}}",
    validDays: 14,
    intro: "Thank you for considering {{business}}. Below is our quotation.",
    notes: "",
    terms:
      "Prices are in Naira and valid until the date shown. Final costs may change if the scope of work changes. Work begins once the quotation is accepted and agreed with our team.",
    acceptMessage: "Thank you! We've received your acceptance and our team will contact you shortly to agree the next steps.",
  },
  chat: {
    enabled: true,
    title: "Chat with us",
    greeting: "Hi there! 👋 Ask us anything about our services or a quote. We'll reply as soon as we can.",
    offlineMessage: "We're away right now, but leave a message and we'll reply as soon as we're back. For a faster answer, message us on WhatsApp.",
    buttonLabel: "Chat with us",
  },
  features: {
    services: true,
    portfolio: true,
    booking: true,
    quotes: true,
    faqs: true,
    testimonials: true,
    clients: true,
    listings: false,
  },
  labels: {
    item: "Project",
    items: "Projects",
    portfolioEyebrow: "Our work",
    aboutItem: "About the project",
    bookCta: "Book a Consultation",
    quoteCta: "Request a Quote",
    similarCta: "Get a quote for something similar",
    askCta: "Ask about this",
    askMessage: "Hello {{business}}, I saw \"{item}\" on your website and I'd like to know more.",
  },
  forms: {
    quoteEyebrow: "Free quotation",
    quoteStep: "What do you need?",
    typeLabel: "Service needed",
    types: ["One-off job", "Ongoing / contract work", "Consultation only", "Other"],
    multiLabel: "",
    multi: [],
    styleLabel: "",
    styles: [],
    sizeLabel: "Size or quantity",
    sizePlaceholder: "e.g. 2 rooms, 50 units, 1 day",
    locationLabel: "Location",
    budgetLabel: "Budget range",
    budgets: ["Under ₦250k", "₦250k to ₦1M", "₦1M to ₦5M", "Above ₦5M", "Not sure yet"],
    timelineLabel: "When do you need it?",
    timelines: ["As soon as possible", "Within 2 weeks", "Within a month", "Just planning"],
    detailsLabel: "Describe what you want",
    detailsPlaceholder: "What would you like done? Anything we should know…",
    showPhotos: true,
    photosLabel: "Photos",
    photosHint: "Photos or examples help us quote more accurately.",
    quoteSubmit: "Request My Quote",
    quoteFootnote: "No payment needed. This is a free, no-obligation quote.",
    quoteSuccessTitle: "Request received",
    quoteSuccessText: "Thank you, {first}. Our team will review your request and send you a quotation. We may call you if we need more details.",
    bookingEyebrow: "Appointment",
    bookingServiceLabel: "Service",
    bookingTypes: ["Office visit", "We visit you", "Phone / video call"],
    bookingTimes: ["Morning (9am to 12pm)", "Afternoon (12pm to 3pm)", "Evening (3pm to 6pm)"],
    addressFor: "We visit you",
    addressLabel: "Address",
    notesLabel: "Anything we should know?",
    notesPlaceholder: "What you need, budget range, questions…",
    bookingSubmit: "Request Booking",
  },
  layout: {
    homeDesign: "industry",
    feel: "modern",
    header: "classic",
    hero: "full",
    services: "numbered",
    cards: "overlay",
    testimonials: "slider",
    footer: "full",
    homeOrder: ["intro", "services", "projects", "process", "clients", "testimonials", "faq", "cta"],
  },
  platform: {
    mode: "demo",
    url: "",
    label: "Open the app",
    currency: "₦",
    demoBalance: 50000,
    usdRate: 1550,
    demoNote: "Demo mode: no real money. Balances, bets and trades are for illustration only.",
  },
  listing: {
    currency: "₦",
    types: ["For Sale", "For Rent", "Short-let"],
    propertyTypes: ["Apartment / Flat", "Duplex", "Bungalow", "Terrace", "Land", "Commercial"],
    statuses: ["Available", "Under offer", "Sold", "Let"],
    showFilters: true,
  },
};

export type SettingsKey = keyof SiteSettings;
export const SETTINGS_KEYS = Object.keys(BASE_DEFAULTS) as SettingsKey[];

const TOKENS: Record<string, string> = {
  business: CLIENT.name,
  short: CLIENT.short || CLIENT.name,
  tagline: CLIENT.tagline,
  email: CLIENT.email,
  phone: CLIENT.phone,
  city: CLIENT.city,
  quotePrefix: CLIENT.quotePrefix,
};

/** Replaces {{business}}, {{short}}… in every string (single-brace {year}, {name}, {item} are left for later). */
function fillTokens<T>(v: T): T {
  if (typeof v === "string") return v.replace(/\{\{(\w+)\}\}/g, (m, k: string) => TOKENS[k] ?? m) as T;
  if (Array.isArray(v)) return v.map(fillTokens) as T;
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fillTokens(x)])) as T;
  return v;
}

function applyOverrides(base: SiteSettings, o: SettingsOverrides): SiteSettings {
  const out = structuredClone(base) as unknown as Record<string, Record<string, unknown>>;
  for (const [key, section] of Object.entries(o)) {
    if (section && out[key]) out[key] = { ...out[key], ...structuredClone(section) };
  }
  return out as unknown as SiteSettings;
}

export const ACTIVE_PACK = { id: PACK.id, name: PACK.name };
export const SITE_DEFAULTS: SiteSettings = fillTokens(applyOverrides(BASE_DEFAULTS, PACK.settings));

/** Merge saved section values over the defaults (one level deep, arrays replaced whole). */
export function mergeSettings(saved: Partial<Record<SettingsKey, unknown>>): SiteSettings {
  const out = structuredClone(SITE_DEFAULTS) as unknown as Record<string, Record<string, unknown>>;
  for (const key of SETTINGS_KEYS) {
    const v = saved[key];
    if (v && typeof v === "object" && !Array.isArray(v)) {
      out[key] = { ...out[key], ...(v as Record<string, unknown>) };
    }
  }
  return out as unknown as SiteSettings;
}
