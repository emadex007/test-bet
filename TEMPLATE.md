# Starting a new client site

Nothing about any client is hard-wired. The industry pack sets the starting text, colours and form questions; the client's details fill in their name; everything is then editable from their dashboard.

## 1. Copy the starter (2 minutes)

On GitHub, open **emadex007/emadex-starter → Settings** and tick **Template repository** (once). Then for each client:

1. Click **Use this template → Create a new repository**, name it after the client (e.g. `prime-homes`).
2. Clone it with GitHub Desktop to `C:\Users\LENOVO\Documents\GitHub\prime-homes`.

## 2. Set it up for the client (3 minutes)

```powershell
cd C:\Users\LENOVO\Documents\GitHub\prime-homes
nvm use 22
npm install
npm run new-client
```

It asks:

| Question | Example |
|---|---|
| What kind of business? | real-estate (or its number) |
| Business name | Prime Homes & Realty |
| Short name | Prime Homes |
| Tagline | Your key to a better home |
| Project ID | prime-homes |
| Business email | hello@primehomes.com |
| Phone / WhatsApp | +234 803 000 0000 |
| City | Abuja |
| Quotation number prefix | PHR-Q |
| Start with sample content? | y (recommended: the site looks finished for the demo) |

## 3. Create their Cloudflare resources and test (5 minutes)

The command prints the exact names. For the example above:

```powershell
npx wrangler d1 create prime_homes_db           # paste the database_id into wrangler.toml
npx wrangler r2 bucket create prime-homes-media
Set-Content -Path .dev.vars -Value "ADMIN_SETUP_CODE=pick-a-long-secret-code" -Encoding ascii
npm run db:migrate:local
npm run dev
```

Open http://localhost:3000 and http://localhost:3000/admin (create the owner account with the setup code).

## 4. Go live (5 minutes)

```powershell
npm run db:migrate:remote
npx wrangler secret put ADMIN_SETUP_CODE
npm run deploy
```

Open `https://prime-homes.<your-subdomain>.workers.dev/admin`, create the owner account, and send the client their link.

Commit and push to the client's repo in GitHub Desktop.

## 5. Make it theirs (in the dashboard, no code)

| Change | Where |
|---|---|
| Logo, favicon | Site settings → Brand |
| Colours (presets or your own), fonts | Site settings → Colours & fonts |
| Sizes, header height, banner height | Site settings → Sizes |
| **Layout styles**: overall feel, header, home banner, services, portfolio cards, testimonials, footer, order of home sections | Site settings → **Layout** |
| Switch off pages they don't need | Site settings → **Features** |
| "Projects" → "Properties", button texts, form questions and options | Site settings → **Words & forms** |
| Listing types, property types, statuses, currency | Site settings → **Listings** (real estate) |
| Home banner, welcome text, section titles, steps | Site settings → Home banner / Home page |
| About story and values | Site settings → About page |
| Contact details, WhatsApp, map, social links | Site settings → Contact & social |
| Services, portfolio/properties, FAQs, testimonials, client logos | Their own menu items |
| Industry things: matches and odds, casino games, promotions, coins… | Their own menu items (they change with the industry) |
| Demo money or link to the real betting/trading platform | Site settings → **Betting / trading** |
| Industry home design or the standard home | Site settings → Layout → Home page design |

## Before handing over

- Replace all sample services, projects/properties and photos with the client's real ones (delete the samples)
- Real phone, WhatsApp, email and address (Site settings → Contact & social)
- Review the FAQ answers against how the business actually works
- Real testimonials and client logos only (the samples are switched off and labelled SAMPLE)
- Optional: Resend for email notifications, the client's domain (uncomment `routes` in wrangler.toml), Cloudflare Web Analytics

## Adding a new industry

1. Copy `src/packs/real-estate.ts` (or the closest pack) to `src/packs/<id>.ts`. Change `id`, `name`, `description`, then the settings the industry needs: text, colours, `features`, `labels`, `forms`. Anything you leave out uses the neutral defaults in `src/lib/site-defaults.ts`.
2. Add sample content at `packs/<id>/seed.sql`: services, projects (with photos), sample testimonials (switched off) and FAQs. Copy one of the existing seed files as a starting point and run every statement through `npm run db:migrate:local` to check it.
3. It now appears in `npm run new-client`.
4. Optional, for an industry that needs its own look and features:
   - **Dashboard pages:** add `collections` to the pack (see `src/packs/betting.ts`). Each one gets a dashboard page automatically, with the fields you list. Items are stored in the `items` table; add samples to `ITEMS` in `scripts/build-seeds.py`.
   - **Home design:** write `src/homes/<id>.tsx` (it receives the dashboard items as `data.items.<kind>`), register it in `src/homes/index.ts`, and set `home: "<id>"` in the pack.
   - **Dashboard menu:** `admin: { hide: [...], rename: {...} }` in the pack.

Use `{{business}}`, `{{short}}`, `{{tagline}}`, `{{email}}`, `{{phone}}`, `{{city}}` and `{{quotePrefix}}` in pack text; they're filled from the client's details.

Packs that already exist are listed in README.md. For apps (online shop with cart, room booking, tracking portals, member accounts), start from the matching app build instead of this website starter.

## Bringing improvements back to the starter

When you improve something for one client that every site should have, make the same change in `emadex-starter` (or copy the changed files across) so the next client gets it too. Keep client-only changes in the client's repo.
