// The client's business details. `npm run new-client` rewrites this file.
// (Not named client.ts on purpose: TanStack Start uses src/client.ts as the browser start-up file.)
// They fill {{business}}, {{short}}, {{tagline}}, {{email}}, {{phone}}, {{city}} and {{quotePrefix}}
// in the default text (src/lib/site-defaults.ts and the industry pack).
// After launch the client edits everything in the dashboard, so this only sets the starting text.

export const CLIENT = {
  name: "Your Business Name",
  short: "Your Business",
  tagline: "Your tagline goes here",
  email: "hello@example.com",
  phone: "+234 800 000 0000",
  city: "Abuja",
  quotePrefix: "Q",
};
