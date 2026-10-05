#!/usr/bin/env node
// Turns a copy of the Emadex Starter into a new client's website.
// Usage (from the project folder):  npm run new-client
//
// It asks for the industry and the client's details, then:
//   - picks the industry pack (src/packs/active.ts) and its sample content (migrations/0100_sample_content.sql)
//   - writes the client's details (src/business.ts), which fill the default text
//   - renames the Worker, database and photo bucket (wrangler.toml, package.json)
// Everything else (logo, colours, photos, text) is then edited in the dashboard.
//
// Answers can also be piped in, one per line, in the order asked.

import { readFileSync, writeFileSync, existsSync, rmSync, readdirSync, copyFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { stdin as input, stdout as output } from "node:process";

// ---------- line-by-line answers (works when typing, pasting several lines, or piping answers in) ----------
const rl = createInterface({ input, terminal: false });
const queue = [];
let waiting = null;
let closed = false;
rl.on("line", (l) => (waiting ? (waiting(l), (waiting = null)) : queue.push(l)));
rl.on("close", () => {
  closed = true;
  if (waiting) waiting("");
});
const nextLine = () => (queue.length ? Promise.resolve(queue.shift()) : closed ? Promise.resolve("") : new Promise((r) => (waiting = r)));
const ask = async (q, def = "") => {
  output.write(def ? `${q} [${def}]: ` : `${q}: `);
  const a = (await nextLine()).trim();
  if (!input.isTTY) output.write((a || def) + "\n");
  return a || def;
};

const slugify = (s) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
const read = (f) => readFileSync(f, "utf8");
const write = (f, s) => writeFileSync(f, s);
const js = (s) => JSON.stringify(s); // safe quoted string for TypeScript

// ---------- industry packs available (src/packs/*.ts with a matching packs/<id>/seed.sql) ----------
const packs = readdirSync("src/packs")
  .filter((f) => f.endsWith(".ts") && !["types.ts", "active.ts", "collections.ts"].includes(f))
  .map((f) => {
    const src = read(`src/packs/${f}`);
    const field = (k) => src.match(new RegExp(`\\b${k}:\\s*"([^"]*)"`))?.[1] ?? "";
    return { id: field("id") || f.replace(/\.ts$/, ""), name: field("name"), description: field("description"), file: f.replace(/\.ts$/, "") };
  })
  .sort((a, b) => (a.id === "general" ? -1 : b.id === "general" ? 1 : a.name.localeCompare(b.name)));

const currentPack = read("src/packs/active.ts").match(/from "\.\/([^"]+)"/)?.[1] ?? "general";
const currentClient = read("src/business.ts").match(/name:\s*"([^"]*)"/)?.[1] ?? "";
const wrangler = read("wrangler.toml");
const oldWorker = wrangler.match(/^name\s*=\s*"([^"]+)"/m)?.[1] ?? "";
const oldDb = wrangler.match(/database_name\s*=\s*"([^"]+)"/)?.[1] ?? "";
const oldBucket = wrangler.match(/bucket_name\s*=\s*"([^"]+)"/)?.[1] ?? "";

console.log(`\nCurrently set up as: ${currentClient} (${currentPack} pack, Worker "${oldWorker}")\n`);
console.log("What kind of business is this?");
packs.forEach((p, i) => console.log(`  ${i + 1}. ${p.name}${p.description ? `: ${p.description}` : ""}`));
const pickRaw = await ask("Choose a number", String(Math.max(1, packs.findIndex((p) => p.file === currentPack) + 1)));
const pack = packs[Number(pickRaw) - 1] ?? packs.find((p) => p.id === pickRaw || p.file === pickRaw);
if (!pack) {
  console.log("That isn't one of the options. Nothing changed.");
  process.exit(1);
}
console.log(`→ ${pack.name}\n`);

const name = await ask("Business name", "");
if (!name) {
  console.log("No name given. Nothing changed.");
  process.exit(0);
}
const short = await ask("Short name (used in 'Welcome to …')", name.split(" ")[0]);
const tagline = await ask("Tagline", "");
const slug = slugify(await ask("Project ID (lowercase, dashes)", slugify(name)));
const email = await ask("Business email", `hello@${slug.replace(/-/g, "")}.com`);
const phone = await ask("Phone / WhatsApp", "+234 800 000 0000");
const city = await ask("City", "Abuja");
const initials = name
  .split(/\s+/)
  .filter((w) => /^[A-Za-z]/.test(w))
  .map((w) => w[0].toUpperCase())
  .join("")
  .slice(0, 4);
const quotePrefix = await ask("Quotation number prefix", `${initials || "Q"}-Q`);
const hasSeed = existsSync(`packs/${pack.file}/seed.sql`);
const withSamples = hasSeed ? (await ask("Start with sample content (services, listings/projects, FAQs)? y/n", "y")).toLowerCase() === "y" : false;
const confirm = (await ask(`\nSet up "${name}" (${slug}) as ${pack.name}? y/n`, "y")).toLowerCase();
if (confirm !== "y") {
  console.log("Cancelled. Nothing changed.");
  process.exit(0);
}

const db = slug.replace(/-/g, "_") + "_db";
const bucket = `${slug}-media`;

// ---- client details ----
write(
  "src/business.ts",
  `// The client's details. \`npm run new-client\` rewrites this file.
// They fill {{business}}, {{short}}, {{tagline}}, {{email}}, {{phone}}, {{city}} and {{quotePrefix}}
// in the default text (src/lib/site-defaults.ts and the industry pack).
// After launch the client edits everything in the dashboard, so this only sets the starting text.

export const CLIENT = {
  name: ${js(name)},
  short: ${js(short)},
  tagline: ${js(tagline)},
  email: ${js(email)},
  phone: ${js(phone)},
  city: ${js(city)},
  quotePrefix: ${js(quotePrefix)},
};
`,
);

// ---- industry pack ----
write(
  "src/packs/active.ts",
  `// The industry pack this site uses. \`npm run new-client\` changes this line.
export { default } from "./${pack.file}";
`,
);

// ---- sample content (runs once, as the last migration) ----
if (withSamples) {
  copyFileSync(`packs/${pack.file}/seed.sql`, "migrations/0100_sample_content.sql");
} else {
  write("migrations/0100_sample_content.sql", "-- No sample content: this site starts empty. Add everything from the dashboard.\nSELECT 1;\n");
}

// ---- wrangler.toml ----
let w = wrangler;
w = w.replace(/^name\s*=\s*"[^"]+"/m, `name = "${slug}"`);
if (oldDb) w = w.split(oldDb).join(db);
if (oldBucket) w = w.split(oldBucket).join(bucket);
w = w.replace(/database_id\s*=\s*"[^"]*"/, 'database_id = "PASTE_DATABASE_ID_HERE"');
w = w.replace(/pattern = "(www\.)?[^"]+"/g, (_m, www) => `pattern = "${www ?? ""}${slug.replace(/-/g, "")}.com"`);
w = w.replace(/^# .*: served on the workers\.dev URL first$/m, `# ${name}: served on the workers.dev URL first`);
write("wrangler.toml", w);

// ---- package.json ----
let p = read("package.json");
p = p.replace(/"name":\s*"[^"]+"/, `"name": "${slug}"`);
if (oldDb) p = p.split(oldDb).join(db);
write("package.json", p);

// ---- README title ----
if (existsSync("README.md")) {
  let r = read("README.md");
  r = r.replace(/^# .*$/m, `# ${name}`);
  if (oldWorker) r = r.split(oldWorker).join(slug);
  if (oldDb) r = r.split(oldDb).join(db);
  if (oldBucket) r = r.split(oldBucket).join(bucket);
  write("README.md", r);
}

// ---- local test data belongs to the old client ----
if (existsSync(".wrangler")) {
  const wipe = (await ask("Delete the old local test database (.wrangler folder)? y/n", "y")).toLowerCase();
  if (wipe === "y") rmSync(".wrangler", { recursive: true, force: true });
}
rl.close();

console.log(`
Done. "${name}" is set up as ${pack.name}. Next:

  npx wrangler d1 create ${db}          (paste the database_id into wrangler.toml)
  npx wrangler r2 bucket create ${bucket}
  npm run db:migrate:local
  npm run dev                                (test at http://localhost:3000)

Go live:
  npm run db:migrate:remote
  npx wrangler secret put ADMIN_SETUP_CODE
  npm run deploy

Then log in at /admin and add the client's logo, real photos and content.
See TEMPLATE.md for what to change, and CLIENT-BRIEF.md for what to ask the client.
`);
