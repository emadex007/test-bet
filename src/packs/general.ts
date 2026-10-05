import { definePack } from "./types";

// Any service business. Uses the neutral defaults in src/lib/site-defaults.ts as they are.
export default definePack({
  id: "general",
  name: "General business",
  description: "Any service business: services, portfolio of work, bookings, quotes, chat.",
  settings: {
    layout: { feel: "modern", header: "classic", hero: "full", services: "numbered", cards: "overlay", testimonials: "slider", footer: "full" },
  },
});
