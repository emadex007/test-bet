import type { Client, Faq, ProjectSummary, Service, Testimonial } from "~/server/db";
import type { Item } from "~/packs/collections";

/** Everything the home page loader returns, passed to an industry's own home page. */
export type HomeData = {
  services: Service[];
  projects: ProjectSummary[];
  testimonials: Testimonial[];
  clients: Client[];
  faqs: Faq[];
  items: Record<string, Item[]>;
};
