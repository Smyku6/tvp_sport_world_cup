
import { readFileSync, writeFileSync, existsSync } from "fs";

const API_URL = "https://sport.tvp.pl/api/sport/www/block/items?device=www&id=41383942";
const KEYWORD = "[SKRÓT]";
const MUNDIAL_KEYWORDS = ["MUNDIAL", "MŚ 2026", "GRUPY", "MECZU"];
const EXCLUDE = ["NHL", "NBA", "HOKEJ"];
const MAX_PAGES = 10;
const DELAY_MS = 1500;

function isMundialMatch(title) {
  const upper = title.toUpperCase();
  if (!upper.includes(KEYWORD)) return false;
  if (EXCLUDE.some((ex) => upper.includes(ex))) return false;
  return MUNDIAL_KEYWORDS.some((kw) => upper.includes(kw));
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function loadExisting() {
  try {
    if (existsSync("docs/data.json")) {
      const data = JSON.parse(readFileSync("docs/data.json", "utf-8"));
      return data.matches || [];
    }
  } catch (e) {
    console.log("Could not read existing data.json, starting fresh");
  }
  return [];
}

async function main() {
  console.log("Fetching TVP Sport API...");
  const existing = loadExisting();
  const existingUrls = new Set(existing.map((m) => m.href));
  console.log(`Existing highlights: ${existing.length}`);

  let newMatches = [];
  let foundAllNew = false;

  for (let page = 1; page <= MAX_PAGES; page++) {
    if (foundAllNew) break;

    const url = `${API_URL}&page=${page}`;
    console.log(`Page ${page}...`);

    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (!res.ok) {
      console.error(`HTTP ${res.status} on page ${page}`);
      break;
    }

    const json = await res.json();
    if (!json.data || !json.data.items || json.data.items.length === 0) {
      console.log("  No more items");
      break;
    }

    let newOnPage = 0;
    let knownOnPage = 0;

    for (const item of json.data.items) {
      if (!isMundialMatch(item.title)) continue;

      if (existingUrls.has(item.url)) {
        knownOnPage++;
        continue;
      }

      const dt = new Date(item.release_date);
      const dateKey = [
        dt.getFullYear(),
        String(dt.getMonth() + 1).padStart(2, "0"),
        String(dt.getDate()).padStart(2, "0"),
      ].join("-");

      newMatches.push({ title: item.title, href: item.url, dateKey });
      existingUrls.add(item.url);
      newOnPage++;
    }

    console.log(`  New: ${newOnPage}, Known: ${knownOnPage}`);

    // Jeśli na tej stronie wszystkie skróty już znamy, nie ma sensu iść dalej
    if (newOnPage === 0 && knownOnPage > 0) {
      console.log("  All highlights on this page already known — stopping.");
      foundAllNew = true;
    }

    if (page < MAX_PAGES && !foundAllNew) await sleep(DELAY_MS);
  }

  // Połącz nowe ze starymi, sortuj po dacie (najnowsze pierwsze)
  const allMatches = [...newMatches, ...existing].sort((a, b) =>
    b.dateKey.localeCompare(a.dateKey)
  );

  const output = {
    updated: new Date().toISOString(),
    count: allMatches.length,
    matches: allMatches,
  };

  writeFileSync("docs/data.json", JSON.stringify(output, null, 2), "utf-8");
  console.log(`Done! ${newMatches.length} new + ${existing.length} existing = ${allMatches.length} total`);
}

main().catch((e) => {
  console.error("Scraper failed:", e.message);
  process.exit(1);
});
