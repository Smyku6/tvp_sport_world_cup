const KEYWORD = "SKRÓT";
const CATEGORY = "PIŁKA NOŻNA";
const TOURNAMENT = "MUNDIAL 2026";

let filterEnabled = true;

const FLAGS = {
  "algieria": "dz",
  "argentyna": "ar",
  "australia": "au",
  "austria": "at",
  "belgia": "be",
  "bo\u015Bnia i hercegowina": "ba",
  "bo\u015Bnia": "ba",
  "bih": "ba",
  "brazylia": "br",
  "kanada": "ca",
  "republika zielonego przyl\u0105dka": "cv",
  "rep. zielonego przyl\u0105dka": "cv",
  "rep. ziel. przyl\u0105dka": "cv",
  "wyspy zielonego przyl\u0105dka": "cv",
  "kolumbia": "co",
  "chorwacja": "hr",
  "curacao": "cw",
  "cura\u00E7ao": "cw",
  "czechy": "cz",
  "dr kongo": "cd",
  "dr konga": "cd",
  "kongo": "cd",
  "ekwador": "ec",
  "egipt": "eg",
  "anglia": "gb-eng",
  "francja": "fr",
  "niemcy": "de",
  "ghana": "gh",
  "haiti": "ht",
  "iran": "ir",
  "irak": "iq",
  "wybrze\u017Ce ko\u015Bci s\u0142oniowej": "ci",
  "wyb. ko\u015Bci s\u0142oniowej": "ci",
  "wks": "ci",
  "japonia": "jp",
  "jordania": "jo",
  "meksyk": "mx",
  "maroko": "ma",
  "holandia": "nl",
  "nowa zelandia": "nz",
  "norwegia": "no",
  "panama": "pa",
  "paragwaj": "py",
  "portugalia": "pt",
  "katar": "qa",
  "arabia saudyjska": "sa",
  "szkocja": "gb-sct",
  "senegal": "sn",
  "rpa": "za",
  "korea p\u0142d.": "kr",
  "korea po\u0142udniowa": "kr",
  "korea": "kr",
  "hiszpania": "es",
  "szwecja": "se",
  "szwajcaria": "ch",
  "tunezja": "tn",
  "turcja": "tr",
  "usa": "us",
  "stany zjednoczone": "us",
  "urugwaj": "uy",
  "uzbekistan": "uz",
};

function flagImg(code) {
  return `<img src="https://flagcdn.com/20x15/${code}.png" class="tvp-flag" alt="">`;
}

function getFlag(name) {
  const lower = name.toLowerCase().trim();
  const sorted = Object.entries(FLAGS).sort((a, b) => b[0].length - a[0].length);
  for (const [country, code] of sorted) {
    if (lower.includes(country)) return flagImg(code);
  }
  return "";
}

function shortTitle(text) {
  const core = text
    .replace(/\[SKRÓT]/gi, "")
    .replace(/M[SŚ]\s*\d{4}:\s*/gi, "")
    .replace(/\.?\s*Skrót\s+meczu.*/i, "")
    .replace(/\.?\s*Wideo\s+z\s+meczu.*/i, "")
    .replace(/\.?\s*Mecz\s+grupy.*/i, "")
    .replace(/\.?\s*Zobacz\s+wideo.*/i, "")
    .replace(/\.?\s*$/, "")
    .trim();
  const parts = core.split(/\s*[–\-]\s*/);
  if (parts.length === 2) {
    const team1 = parts[0].trim();
    const team2 = parts[1].trim();
    return `${getFlag(team1)} ${team1} – ${getFlag(team2)} ${team2}`;
  }
  return core;
}

const DAY_NAMES = [
  "NIEDZIELA", "PONIEDZIAŁEK", "WTOREK", "ŚRODA",
  "CZWARTEK", "PIĄTEK", "SOBOTA",
];

const MONTH_NAMES = [
  "STYCZNIA", "LUTEGO", "MARCA", "KWIETNIA", "MAJA", "CZERWCA",
  "LIPCA", "SIERPNIA", "WRZEŚNIA", "PAŹDZIERNIKA", "LISTOPADA", "GRUDNIA",
];

function getDateKey(item) {
  const time = item.querySelector("time[datetime]");
  if (!time) return null;
  const dt = new Date(time.getAttribute("datetime"));
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

function formatDateHeading(dateKey) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const dayName = DAY_NAMES[dt.getDay()];
  const monthName = MONTH_NAMES[dt.getMonth()];
  return `${d} ${monthName} — ${dayName}`;
}

function filterVideos() {
  const items = document.querySelectorAll(".box-small");

  const groups = new Map();
  let hidden = 0;

  items.forEach((item) => {
    const title = item.querySelector(".box-small__title, .box-small__link");
    if (!title) return;

    const fullText = (item.textContent || "").toUpperCase();
    const hasKeyword = fullText.includes(KEYWORD);
    const hasCategory = fullText.includes(CATEGORY);
    const hasTournament = fullText.includes(TOURNAMENT);

    if (!hasKeyword || !hasCategory || !hasTournament) {
      hidden++;
      return;
    }

    const dateKey = getDateKey(item) || "0000-00-00";
    if (!groups.has(dateKey)) groups.set(dateKey, []);
    groups.get(dateKey).push(item);
  });

  // Ukryj oryginalną sekcję
  const section = document.querySelector("section.video");
  if (section) section.style.display = "none";

  // Usuń poprzedni kontener
  const old = document.getElementById("tvp-skrot-container");
  if (old) old.remove();

  // Zbuduj nowy kontener
  const container = document.createElement("div");
  container.id = "tvp-skrot-container";

  const sortedDates = [...groups.keys()].sort((a, b) => b.localeCompare(a));
  let shown = 0;

  sortedDates.forEach((dateKey) => {
    const heading = document.createElement("div");
    heading.className = "tvp-date-heading";
    heading.textContent = formatDateHeading(dateKey);
    container.appendChild(heading);

    const grid = document.createElement("div");
    grid.className = "tvp-matches-grid";

    groups.get(dateKey).forEach((item) => {
      // Zbuduj prosty kafelek z linkiem, flagami i nazwami drużyn
      const link = item.querySelector("a.box-small__link");
      const titleEl = item.querySelector(".box-small__title");
      const href = link ? link.getAttribute("href") : "#";
      const titleText = titleEl ? titleEl.textContent : (link ? link.textContent : "");

      const card = document.createElement("div");
      card.className = "tvp-match-card";
      const a = document.createElement("a");
      a.href = href;
      a.innerHTML = shortTitle(titleText);
      card.appendChild(a);
      grid.appendChild(card);
      shown++;
    });

    container.appendChild(grid);
  });

  // Przenieś przycisk "Zobacz więcej" do naszego kontenera
  const loadMoreBtn = document.querySelector(".button-more");
  if (loadMoreBtn) {
    const btnWrapper = document.createElement("div");
    btnWrapper.className = "tvp-load-more";
    btnWrapper.appendChild(loadMoreBtn.cloneNode(true));
    btnWrapper.querySelector(".button-more").addEventListener("click", () => {
      // Kliknij oryginalny przycisk
      loadMoreBtn.click();
    });
    container.appendChild(btnWrapper);
  }

  // Wstaw kontener na stronę
  const main = document.querySelector("section.video") || document.querySelector("main") || document.body;
  main.parentNode.insertBefore(container, main);

  updateBadge(shown, hidden);
}

function updateBadge(shown, hidden) {
  const badge = document.getElementById("tvp-skrot-badge");
  if (badge) {
    badge.textContent = filterEnabled
      ? `Skróty: ${shown} | Ukryte: ${hidden}`
      : "Filtr wyłączony (kliknij aby włączyć)";
  }
}

function createBadge() {
  if (document.getElementById("tvp-skrot-badge")) return;

  const badge = document.createElement("div");
  badge.id = "tvp-skrot-badge";
  badge.textContent = "TVP Skróty";
  document.body.appendChild(badge);

  badge.addEventListener("click", () => {
    filterEnabled = !filterEnabled;
    filterVideos();
  });
}

function removeAds() {
  const selectors = [
    ".top_wrapper--desktop.ad_slot",
    ".footer-ads",
    ".stickyad__wrapper",
    ".interstitialwelcome__wrapper",
    ".interstitial__wrapper",
    ".ad_slot",
    ".ad_wrapper",
    "header.header",
    "footer.footer",
  ];
  selectors.forEach((sel) => {
    document.querySelectorAll(sel).forEach((el) => el.remove());
  });
}

let observer;
let debounceTimer;
let isUpdating = false;

function pauseObserver() {
  isUpdating = true;
}

function resumeObserver() {
  setTimeout(() => { isUpdating = false; }, 100);
}

function init() {
  pauseObserver();
  removeAds();
  createBadge();
  filterVideos();
  resumeObserver();

  observer = new MutationObserver(() => {
    if (isUpdating) return;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      pauseObserver();
      removeAds();
      filterVideos();
      resumeObserver();
    }, 500);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
