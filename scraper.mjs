import { writeFileSync } from "fs";

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
  // Mundialowe skróty zawierają "grupy" lub "meczu" lub "MŚ 2026"
  return MUNDIAL_KEYWORDS.some((kw) => upper.includes(kw));
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log("Fetching TVP Sport API...");
  let allMatches = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
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

    const highlights = json.data.items
      .filter((item) => isMundialMatch(item.title))
      .map((item) => {
        const dt = new Date(item.release_date);
        const dateKey = [
          dt.getFullYear(),
          String(dt.getMonth() + 1).padStart(2, "0"),
          String(dt.getDate()).padStart(2, "0"),
        ].join("-");

        return {
          title: item.title,
          href: item.url,
          dateKey,
        };
      });

    console.log(`  Found ${highlights.length} mundial highlights`);
    allMatches = allMatches.concat(highlights);

    if (page < MAX_PAGES) await sleep(DELAY_MS);
  }

  // Deduplikacja
  const seen = new Set();
  const unique = allMatches.filter((m) => {
    if (seen.has(m.href)) return false;
    seen.add(m.href);
    return true;
  });

  const output = {
    updated: new Date().toISOString(),
    count: unique.length,
    matches: unique,
  };

  writeFileSync("docs/data.json", JSON.stringify(output, null, 2), "utf-8");
  console.log(`Done! ${unique.length} highlights saved to docs/data.json`);
}

main().catch((e) => {
  console.error("Scraper failed:", e.message);
  process.exit(1);
});
