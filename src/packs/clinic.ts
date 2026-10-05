import { definePack } from "./types";

const U = (id: string, w = 1600) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

// Clinics, hospitals, dental and eye clinics, pharmacies, labs and physiotherapy.
// Appointment requests only: no medical records or diagnoses are collected.
export default definePack({
  id: "clinic",
  name: "Clinic & healthcare",
  description: "Clinics, hospitals, dental, eye, labs, pharmacies, physio. Departments, appointment booking, contact. No medical records.",
  settings: {
    theme: {
      primary: "#0E5A6B",
      onPrimary: "#FFFFFF",
      accent: "#2BB3A3",
      background: "#F4F9FA",
      surface: "#FFFFFF",
      text: "#10303A",
      muted: "#56707A",
      border: "#DCEAEE",
      headingFont: "DM Serif Display",
      bodyFont: "Inter",
      radius: 10,
    },
    topBar: { text: "In an emergency, go to the nearest hospital or call 112.", background: "#0E5A6B", textColor: "#D4F1EE" },
    header: {
      background: "#FFFFFF",
      textColor: "#0E5A6B",
      nav: [
        { label: "Home", to: "/" },
        { label: "Services", to: "/services" },
        { label: "About", to: "/about" },
        { label: "Contact", to: "/contact" },
      ],
      cta: { label: "Book an Appointment", to: "/book" },
    },
    hero: {
      image: U("1519494026892-80bbd2d6fd0d", 2200),
      overlay: 0.5,
      eyebrow: "Healthcare in {{city}}",
      title: "Caring for you and your family",
      subtitle: "{{business}} provides friendly, professional care with experienced doctors, modern equipment and short waiting times.",
      primaryCta: { label: "Book an Appointment", to: "/book" },
      secondaryCta: { label: "Our Services", to: "/services" },
    },
    home: {
      introEyebrow: "Welcome to {{short}}",
      introTitle: "Quality care, close to home.",
      introText:
        "{{business}} offers general consultations, specialist care, laboratory tests and more under one roof. Our team takes time to listen, explain and care for every patient.",
      introImage: U("1576091160399-112ba8d25d1d", 1400),
      servicesEyebrow: "Departments",
      servicesTitle: "Our Services",
      processEyebrow: "Your visit",
      processTitle: "Seeing a doctor is easy",
      process: [
        { title: "Book", text: "Request an appointment online, by phone or on WhatsApp." },
        { title: "Confirm", text: "We confirm your date and time." },
        { title: "Consult", text: "See our doctor with little or no waiting." },
        { title: "Follow-up", text: "We check on you and arrange any follow-up care." },
      ],
      ctaTitle: "Need to see a doctor?",
      ctaText: "Book an appointment online. For emergencies, go to the nearest hospital immediately.",
      ctaImage: U("1505751172876-fa1923c5c528", 2000),
      testimonialsTitle: "What our patients say",
      clientsTitle: "HMOs and partners we work with",
    },
    about: {
      heroImage: U("1519494026892-80bbd2d6fd0d", 2200),
      intro: "Our team, our care and our commitment to you.",
      story:
        "{{business}} was established to make quality healthcare easy to reach. Our doctors, nurses and staff are committed to treating every patient with respect, care and professionalism.\n\nWe invest in modern equipment and keep high standards of hygiene, so you can trust the care you receive.",
      image: U("1579684385127-1ef15d508118", 1400),
      values: [
        { title: "Compassion", text: "We treat every patient like family." },
        { title: "Professionalism", text: "Qualified, licensed medical staff." },
        { title: "Hygiene", text: "Strict cleaning and infection control." },
        { title: "Privacy", text: "Your health information stays confidential." },
      ],
    },
    pages: {
      servicesIntro: "Consultations, specialist clinics, laboratory and more.",
      servicesImage: U("1579684385127-1ef15d508118", 2200),
      bookTitle: "Book an Appointment",
      bookIntro: "Request an appointment and we'll confirm the time. For emergencies, go to the nearest hospital.",
      contactIntro: "Call, WhatsApp or send a message. For emergencies, go to the nearest hospital or call 112.",
      formsImage: U("1576091160399-112ba8d25d1d", 2200),
    },
    contact: { hours: "Mon to Sat, 8:00am to 8:00pm · Sun, 12:00pm to 6:00pm", whatsappMessage: "Hello {{business}}, I'd like to book an appointment." },
    footer: {
      background: "#0E5A6B",
      textColor: "#DDEFF1",
      about: "Friendly, professional healthcare in {{city}}. This website is for information and appointments only, not emergencies or medical advice.",
    },
    seo: {
      title: "{{business}} | Clinic in {{city}}",
      description: "{{business}} in {{city}}: consultations, specialist clinics, laboratory tests and more. Book an appointment online.",
      ogImage: U("1519494026892-80bbd2d6fd0d", 1200),
    },
    chat: {
      greeting: "Hello! 👋 Ask us about appointments, opening hours or our services. For emergencies, please go to the nearest hospital. Please don't share medical details here.",
    },
    features: { portfolio: false, quotes: false },
    labels: {
      bookCta: "Book an Appointment",
      quoteCta: "Contact Us",
      askCta: "Ask on WhatsApp",
    },
    forms: {
      bookingEyebrow: "Appointment",
      bookingServiceLabel: "Department / service",
      bookingTypes: ["Visit the clinic", "Video consultation", "Home visit"],
      bookingTimes: ["Morning (8am to 12pm)", "Afternoon (12pm to 4pm)", "Evening (4pm to 8pm)"],
      addressFor: "Home visit",
      addressLabel: "Home address",
      notesLabel: "Reason for visit (optional)",
      notesPlaceholder: "Keep it brief. Our team will ask for any details in person.",
      bookingSubmit: "Request Appointment",
    },
    layout: { feel: "modern", header: "classic", hero: "split", services: "icons", cards: "below", testimonials: "grid", footer: "simple", homeOrder: ["services", "intro", "process", "testimonials", "faq", "clients", "projects", "cta"] },
  },
});
