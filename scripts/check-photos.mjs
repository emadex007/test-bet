#!/usr/bin/env node
// Checks every Unsplash sample photo used by the packs and sample content, and lists any that no longer load.
// Usage (from the project folder):  npm run check-photos
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const roots = ["src", "packs"];
const files = [];
const walk = (d) => {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(ts|tsx|sql)$/.test(f)) files.push(p);
  }
};
roots.forEach(walk);

const where = new Map(); // id -> Set(files)
for (const f of files) {
  for (const m of readFileSync(f, "utf8").matchAll(/(?:photo-|U\(")(\d{10,}-[0-9a-f]{6,})/g)) {
    if (!where.has(m[1])) where.set(m[1], new Set());
    where.get(m[1]).add(f);
  }
}

const ids = [...where.keys()];
console.log(`Checking ${ids.length} photos…`);
const bad = [];
let done = 0;
await Promise.all(
  Array.from({ length: 8 }, async () => {
    while (ids.length) {
      const id = ids.pop();
      try {
        const res = await fetch(`https://images.unsplash.com/photo-${id}?w=40&q=10`, { method: "HEAD" });
        if (!res.ok) bad.push([id, res.status]);
      } catch (e) {
        bad.push([id, e.message]);
      }
      done++;
    }
  }),
);
if (!bad.length) console.log(`All ${done} photos load. ✓`);
else {
  console.log(`\n${bad.length} photo(s) don't load:\n`);
  for (const [id, status] of bad) console.log(`  ${id}  (${status})  in ${[...where.get(id)].join(", ")}`);
  console.log("\nCopy this list into the chat and the photos can be replaced.");
}
