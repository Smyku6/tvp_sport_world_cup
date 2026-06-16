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

const ROUND_LABELS = {
  "R32": "1/16 finału",
  "R16": "1/8 finału",
  "QF": "Ćwierćfinał",
  "SF": "Półfinał",
  "3rd": "Mecz o 3. miejsce",
  "Final": "Finał",
};

function flagImg(code) {
  return `<img src="https://flagcdn.com/24x18/${code}.png" class="flag" alt="">`;
}

function getFlagCode(name) {
  const lower = name.toLowerCase().trim();
  const sorted = Object.entries(FLAGS).sort((a, b) => b[0].length - a[0].length);
  for (const [country, code] of sorted) {
    if (lower.includes(country)) return code;
  }
  return null;
}

function getFlag(name) {
  const code = getFlagCode(name);
  return code ? flagImg(code) : "";
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

function isToday(dateKey) {
  const now = new Date();
  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
  return dateKey === today;
}

function isPast(dateKey, time) {
  const [h, m] = time.split(":").map(Number);
  const [y, mo, d] = dateKey.split("-").map(Number);
  const matchEnd = new Date(y, mo - 1, d, h + 2, m);
  return matchEnd < new Date();
}

function isLive(dateKey, time) {
  const [h, m] = time.split(":").map(Number);
  const [y, mo, d] = dateKey.split("-").map(Number);
  const kickoff = new Date(y, mo - 1, d, h, m);
  const matchEnd = new Date(y, mo - 1, d, h + 2, m);
  const now = new Date();
  return now >= kickoff && now <= matchEnd;
}

// --- Highlights ---

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

// --- Schedule ---

function buildHighlightIndex(matches) {
  const index = {};
  for (const m of matches) {
    const core = m.title
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
      const code1 = getFlagCode(parts[0]);
      const code2 = getFlagCode(parts[1]);
      if (code1 && code2) {
        const key = [code1, code2].sort().join("|");
        index[key] = m.href;
      }
    }
  }
  return index;
}

function findHighlight(team1, team2, highlightIndex) {
  const code1 = getFlagCode(team1);
  const code2 = getFlagCode(team2);
  if (!code1 || !code2) return null;
  const key = [code1, code2].sort().join("|");
  return highlightIndex[key] || null;
}

function renderSchedule(schedule, highlightIndex) {
  const groups = new Map();
  schedule.forEach((m) => {
    if (!groups.has(m.date)) groups.set(m.date, []);
    groups.get(m.date).push(m);
  });

  const sortedDates = [...groups.keys()].sort((a, b) => a.localeCompare(b));
  let html = "";
  let scrollToId = null;

  sortedDates.forEach((dateKey) => {
    const today = isToday(dateKey);
    if (today && !scrollToId) scrollToId = `date-${dateKey}`;

    html += `<div class="date-heading${today ? " today" : ""}" id="date-${dateKey}">${formatDateHeading(dateKey)}</div>`;

    groups.get(dateKey).forEach((m) => {
      const played = isPast(m.date, m.time);
      const live = isLive(m.date, m.time);

      if (m.round) {
        // Knockout match without teams yet
        const label = ROUND_LABELS[m.round] || m.round;
        const cls = ["schedule-match", played ? "played" : "", live ? "live" : ""].filter(Boolean).join(" ");
        html += `<div class="${cls}">`;
        html += `<span class="schedule-time">${m.time}</span>`;
        html += `<span class="schedule-teams">${label}</span>`;
        html += `</div>`;
      } else {
        const highlight = findHighlight(m.team1, m.team2, highlightIndex);
        const hasHighlight = !!highlight;
        const cls = [
          "schedule-match",
          played ? "played" : "",
          live ? "live" : "",
          hasHighlight ? "has-highlight" : "",
        ].filter(Boolean).join(" ");

        const flag1 = getFlag(m.team1);
        const flag2 = getFlag(m.team2);
        const teamsHtml = `${flag1} ${m.team1} – ${flag2} ${m.team2}`;
        const badge = hasHighlight ? `<span class="highlight-badge">SKRÓT</span>` : "";

        const inner = `
          <span class="schedule-time">${m.time}</span>
          <span class="schedule-teams">${teamsHtml}${badge}</span>
          <span class="schedule-group">Grupa ${m.group}</span>
        `;

        if (hasHighlight) {
          html += `<div class="${cls}"><a href="${highlight}" target="_blank" rel="noopener">${inner}</a></div>`;
        } else {
          html += `<div class="${cls}">${inner}</div>`;
        }
      }
    });
  });

  return { html, scrollToId };
}

// --- Tabs ---

function initTabs() {
  const tabs = document.querySelectorAll(".tab");
  const sections = document.querySelectorAll(".section");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      sections.forEach((s) => s.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(tab.dataset.tab).classList.add("active");
    });
  });
}

// --- TVP API ---

const TVP_API = "https://sport.tvp.pl/api/sport/www/block/items?device=www&id=41383942";
const KEYWORD = "[SKRÓT]";
const MUNDIAL_KEYWORDS = ["MUNDIAL", "MŚ 2026", "GRUPY", "MECZU"];
const EXCLUDE_KW = ["NHL", "NBA", "HOKEJ"];

function isMundialMatch(title) {
  const upper = title.toUpperCase();
  if (!upper.includes(KEYWORD)) return false;
  if (EXCLUDE_KW.some((ex) => upper.includes(ex))) return false;
  return MUNDIAL_KEYWORDS.some((kw) => upper.includes(kw));
}

async function fetchLiveHighlights() {
  const res = await fetch(`${TVP_API}&page=1`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (!json.data || !json.data.items) return [];

  const matches = [];
  for (const item of json.data.items) {
    if (!isMundialMatch(item.title)) continue;
    const dt = new Date(item.release_date);
    const dateKey = [
      dt.getFullYear(),
      String(dt.getMonth() + 1).padStart(2, "0"),
      String(dt.getDate()).padStart(2, "0"),
    ].join("-");
    matches.push({ title: item.title, href: item.url, dateKey });
  }
  return matches;
}

// --- State ---

let cachedSchedule = null;
let cachedScrollToId = null;

function renderAll(matches, schedule) {
  const highlightsDiv = document.getElementById("highlights");
  const scheduleDiv = document.getElementById("schedule");

  if (matches.length > 0) {
    highlightsDiv.innerHTML = renderMatches(matches);
    highlightsDiv.innerHTML += `<div class="stats">${matches.length} skrótów</div>`;
  } else {
    highlightsDiv.innerHTML = `<div id="loading">Brak skrótów.</div>`;
  }

  if (schedule) {
    const highlightIndex = buildHighlightIndex(matches);
    const { html, scrollToId } = renderSchedule(schedule, highlightIndex);
    scheduleDiv.innerHTML = html;
    cachedScrollToId = scrollToId;
  }
}

// --- Refresh ---

async function refreshHighlights() {
  const btn = document.getElementById("refreshBtn");
  const status = document.getElementById("refreshStatus");

  btn.disabled = true;
  btn.textContent = "Pobieranie...";
  status.textContent = "";

  try {
    // Fetch from TVP API + data.json
    const [liveMatches, dataRes] = await Promise.all([
      fetchLiveHighlights(),
      fetch("data.json?" + Date.now()),
    ]);
    const data = dataRes.ok ? await dataRes.json() : { matches: [] };
    const existingUrls = new Set((data.matches || []).map(m => m.href));
    const newMatches = liveMatches.filter(m => !existingUrls.has(m.href));

    const liveUrls = new Set(liveMatches.map(m => m.href));
    const extra = (data.matches || []).filter(m => !liveUrls.has(m.href));
    const merged = [...liveMatches, ...extra].sort((a, b) => b.dateKey.localeCompare(a.dateKey));

    renderAll(merged, cachedSchedule);

    if (newMatches.length > 0) {
      status.textContent = `Znaleziono ${newMatches.length} nowych skrótów!`;
      status.style.color = "#4caf50";
    } else {
      status.textContent = "Dane aktualne, brak nowych skrótów";
      status.style.color = "#4caf50";
    }
  } catch (e) {
    // CORS or other error — fall back to re-fetching data.json
    try {
      const dataRes = await fetch("data.json?" + Date.now());
      if (!dataRes.ok) throw new Error(`HTTP ${dataRes.status}`);
      const data = await dataRes.json();

      renderAll(data.matches || [], cachedSchedule);

      const updated = new Date(data.updated);
      const timeAgo = Math.round((Date.now() - updated) / 60000);
      const timeStr = timeAgo < 60
        ? `${timeAgo} min temu`
        : `${Math.round(timeAgo / 60)} godz. temu`;

      status.textContent = `Odświeżono z cache (akt. ${timeStr})`;
      status.style.color = "#f0c040";
    } catch (e2) {
      status.textContent = `Błąd: ${e2.message}`;
      status.style.color = "#ff6b6b";
    }
  }

  btn.disabled = false;
  btn.textContent = "ODŚWIEŻ";
}

// --- Init ---

async function loadData() {
  const loading = document.getElementById("loading");
  const error = document.getElementById("error");

  try {
    const [dataRes, scheduleRes] = await Promise.all([
      fetch("data.json?" + Date.now()),
      fetch("schedule.json?" + Date.now()),
    ]);

    const data = dataRes.ok ? await dataRes.json() : { matches: [] };
    if (!scheduleRes.ok) throw new Error(`schedule.json: HTTP ${scheduleRes.status}`);
    cachedSchedule = await scheduleRes.json();

    loading.style.display = "none";

    // Highlights
    const highlightsDiv = document.getElementById("highlights");
    if (data.matches && data.matches.length > 0) {
      const updated = new Date(data.updated);
      const timeAgo = Math.round((Date.now() - updated) / 60000);
      const timeStr = timeAgo < 60
        ? `${timeAgo} min temu`
        : `${Math.round(timeAgo / 60)} godz. temu`;

      highlightsDiv.innerHTML = renderMatches(data.matches);
      highlightsDiv.innerHTML += `<div class="stats">${data.count} skrótów | Aktualizacja: ${timeStr}</div>`;
    } else {
      highlightsDiv.innerHTML = `<div id="loading">Brak skrótów. Scraper jeszcze nie zadziałał.</div>`;
    }

    // Schedule
    const highlightIndex = buildHighlightIndex(data.matches || []);
    const { html, scrollToId } = renderSchedule(cachedSchedule, highlightIndex);
    document.getElementById("schedule").innerHTML = html;
    cachedScrollToId = scrollToId;

    // Scroll to today on schedule tab click
    document.querySelector('[data-tab="schedule"]').addEventListener("click", () => {
      if (cachedScrollToId) {
        setTimeout(() => {
          const el = document.getElementById(cachedScrollToId);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    });

  } catch (e) {
    loading.style.display = "none";
    error.style.display = "block";
    error.textContent = `Błąd: ${e.message}`;
  }
}

document.getElementById("refreshBtn").addEventListener("click", refreshHighlights);
initTabs();
loadData();
