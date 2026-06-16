import { writeFileSync } from "fs";

const API_URL = "https://sport.tvp.pl/api/sport/www/block/items?device=www&id=41383942";
const KEYWORD = "[SKRÓT]";

async function main() {
  console.log("Fetching TVP Sport API...");
  const res = await fetch(API_URL, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();

  if (!json.data || !json.data.items) {
    throw new Error("No data in API response");
  }

  console.log(`Total items: ${json.data.total_count}`);

  const matches = json.data.items
    .filter((item) => item.title.includes(KEYWORD))
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

  const output = {
    updated: new Date().toISOString(),
    count: matches.length,
    matches,
  };

  writeFileSync("docs/data.json", JSON.stringify(output, null, 2), "utf-8");
  console.log(`Done! ${matches.length} highlights saved to docs/data.json`);
}

main().catch((e) => {
  console.error("Scraper failed:", e.message);
  process.exit(1);
});
