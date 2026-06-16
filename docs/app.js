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
      .trim()
      .toLowerCase();
    const parts = core.split(/\s*[–\-]\s*/);
    if (parts.length === 2) {
      const key = parts.map(p => p.trim()).sort().join("|");
      index[key] = m.href;
    }
  }
  return index;
}

function findHighlight(team1, team2, highlightIndex) {
  const key = [team1.toLowerCase().trim(), team2.toLowerCase().trim()].sort().join("|");
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

// --- Init ---

async function loadData() {
  const loading = document.getElementById("loading");
  const error = document.getElementById("error");
  const highlightsDiv = document.getElementById("highlights");
  const scheduleDiv = document.getElementById("schedule");

  try {
    const [dataRes, scheduleRes] = await Promise.all([
      fetch("data.json"),
      fetch("schedule.json"),
    ]);

    if (!dataRes.ok) throw new Error(`data.json: HTTP ${dataRes.status}`);
    if (!scheduleRes.ok) throw new Error(`schedule.json: HTTP ${scheduleRes.status}`);

    const data = await dataRes.json();
    const schedule = await scheduleRes.json();

    loading.style.display = "none";

    // Highlights
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
    const { html, scrollToId } = renderSchedule(schedule, highlightIndex);
    scheduleDiv.innerHTML = html;

    // If switching to schedule tab, scroll to today
    document.querySelector('[data-tab="schedule"]').addEventListener("click", () => {
      if (scrollToId) {
        setTimeout(() => {
          const el = document.getElementById(scrollToId);
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

initTabs();
loadData();
