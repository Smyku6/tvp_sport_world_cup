const FLAGS = {
  "algieria": "dz", "argentyna": "ar", "australia": "au", "austria": "at",
  "belgia": "be", "bośnia i hercegowina": "ba", "bośnia": "ba", "bih": "ba",
  "brazylia": "br", "kanada": "ca",
  "republika zielonego przylądka": "cv", "rep. zielonego przylądka": "cv",
  "rep. ziel. przylądka": "cv",
  "kolumbia": "co", "chorwacja": "hr", "curacao": "cw", "curaçao": "cw",
  "czechy": "cz", "dr kongo": "cd", "dr konga": "cd", "kongo": "cd",
  "ekwador": "ec", "egipt": "eg", "anglia": "gb-eng",
  "francja": "fr", "niemcy": "de", "ghana": "gh", "haiti": "ht",
  "iran": "ir", "irak": "iq",
  "wybrzeże kości słoniowej": "ci", "wyb. kości słoniowej": "ci", "wks": "ci",
  "japonia": "jp", "jordania": "jo", "meksyk": "mx", "maroko": "ma",
  "holandia": "nl", "nowa zelandia": "nz", "norwegia": "no",
  "panama": "pa", "paragwaj": "py", "portugalia": "pt", "katar": "qa",
  "arabia saudyjska": "sa", "szkocja": "gb-sct", "senegal": "sn", "rpa": "za",
  "korea płd.": "kr", "korea południowa": "kr", "korea": "kr",
  "hiszpania": "es", "szwecja": "se", "szwajcaria": "ch",
  "tunezja": "tn", "turcja": "tr",
  "usa": "us", "stany zjednoczone": "us", "urugwaj": "uy", "uzbekistan": "uz",
};

const DAY_NAMES = ["NIEDZIELA","PONIEDZIAŁEK","WTOREK","ŚRODA","CZWARTEK","PIĄTEK","SOBOTA"];
const MONTH_NAMES = ["STYCZNIA","LUTEGO","MARCA","KWIETNIA","MAJA","CZERWCA","LIPCA","SIERPNIA","WRZEŚNIA","PAŹDZIERNIKA","LISTOPADA","GRUDNIA"];

function flagImg(code) {
  return `<img src="https://flagcdn.com/24x18/${code}.png" class="flag" alt="">`;
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

function formatDateHeading(dateKey) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return `${d} ${MONTH_NAMES[dt.getMonth()]} — ${DAY_NAMES[dt.getDay()]}`;
}

function renderMatches(matches) {
  const groups = new Map();
  matches.forEach((m) => {
    if (!groups.has(m.dateKey)) groups.set(m.dateKey, []);
    groups.get(m.dateKey).push(m);
  });

  const sortedDates = [...groups.keys()].sort((a, b) => b.localeCompare(a));
  let html = "";

  sortedDates.forEach((dateKey) => {
    html += `<div class="date-heading">${formatDateHeading(dateKey)}</div>`;
    html += `<div class="matches-grid">`;
    groups.get(dateKey).forEach((m) => {
      html += `<div class="match-card"><a href="${m.href}" target="_blank" rel="noopener">${shortTitle(m.title)}</a></div>`;
    });
    html += `</div>`;
  });

  return html;
}

async function loadMatches() {
  const loading = document.getElementById("loading");
  const error = document.getElementById("error");
  const matchesDiv = document.getElementById("matches");

  try {
    const res = await fetch("data.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    loading.style.display = "none";

    if (!data.matches || data.matches.length === 0) {
      matchesDiv.innerHTML = `<div id="loading">Brak skrótów. Scraper jeszcze nie zadziałał.</div>`;
      return;
    }

    const updated = new Date(data.updated);
    const timeAgo = Math.round((Date.now() - updated) / 60000);
    const timeStr = timeAgo < 60
      ? `${timeAgo} min temu`
      : `${Math.round(timeAgo / 60)} godz. temu`;

    matchesDiv.innerHTML = renderMatches(data.matches);
    matchesDiv.innerHTML += `<div class="stats">${data.count} skrótów | Aktualizacja: ${timeStr}</div>`;
  } catch (e) {
    loading.style.display = "none";
    error.style.display = "block";
    error.textContent = `Błąd: ${e.message}`;
  }
}

loadMatches();
