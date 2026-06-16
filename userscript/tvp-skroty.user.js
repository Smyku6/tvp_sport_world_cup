// ==UserScript==
// @name         TVP Sport - Tylko Skróty Mundial 2026
// @namespace    https://sport.tvp.pl
// @version      1.0.0
// @description  Filtruje sport.tvp.pl/wideo — pokazuje tylko skróty meczów Mundialu 2026 z flagami
// @author       Smyku6
// @match        https://sport.tvp.pl/wideo*
// @grant        GM_addStyle
// @run-at       document-idle
// ==/UserScript==

(function () {
  "use strict";

  // ========== STYLE ==========
  GM_addStyle(`
    #tvp-skrot-container {
      max-width: 1140px;
      margin: 20px auto;
      padding: 0 15px;
    }
    .tvp-date-heading {
      width: 100%;
      padding: 14px 16px;
      margin: 24px 0 12px;
      background: #1a1a2e;
      color: #e94560;
      font-family: Arial, sans-serif;
      font-size: 20px;
      font-weight: bold;
      border-left: 4px solid #e94560;
      border-radius: 4px;
      box-sizing: border-box;
    }
    .tvp-date-heading:first-child {
      margin-top: 0;
    }
    .tvp-matches-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 8px;
    }
    .tvp-match-card {
      background: #fff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
      transition: transform 0.15s, box-shadow 0.15s;
    }
    .tvp-match-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }
    .tvp-flag {
      display: inline-block;
      width: 20px;
      height: 15px;
      vertical-align: middle;
      margin-right: 2px;
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 2px;
    }
    .tvp-match-card a {
      text-decoration: none;
      color: #1a1a2e;
      display: block;
      padding: 12px 14px;
      font-size: 15px;
      font-weight: 600;
      line-height: 1.4;
    }
    .tvp-match-card a:hover {
      color: #e94560;
    }
    .tvp-load-more {
      text-align: center;
      margin: 24px 0;
    }
    .tvp-load-more .button-more {
      display: inline-block;
      padding: 12px 32px;
      background: #1a1a2e;
      color: #e94560;
      font-size: 16px;
      font-weight: bold;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s;
    }
    .tvp-load-more .button-more:hover {
      background: #2a2a4e;
    }
    #tvp-skrot-badge {
      position: fixed;
      top: 10px;
      right: 10px;
      z-index: 99999;
      background: #d32f2f;
      color: white;
      padding: 8px 16px;
      border-radius: 8px;
      font-family: Arial, sans-serif;
      font-size: 14px;
      font-weight: bold;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      user-select: none;
      transition: background 0.2s;
    }
    #tvp-skrot-badge:hover {
      background: #b71c1c;
    }
    @media (max-width: 992px) {
      .tvp-matches-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }
    @media (max-width: 768px) {
      .tvp-matches-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `);

  // ========== CONFIG ==========
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
    "bośnia i hercegowina": "ba",
    "bośnia": "ba",
    "bih": "ba",
    "brazylia": "br",
    "kanada": "ca",
    "republika zielonego przylądka": "cv",
    "rep. zielonego przylądka": "cv",
    "rep. ziel. przylądka": "cv",
    "wyspy zielonego przylądka": "cv",
    "kolumbia": "co",
    "chorwacja": "hr",
    "curacao": "cw",
    "curaçao": "cw",
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
    "wybrzeże kości słoniowej": "ci",
    "wyb. kości słoniowej": "ci",
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
    "korea płd.": "kr",
    "korea południowa": "kr",
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

  // ========== HELPERS ==========
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

  // ========== CORE ==========
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

    const section = document.querySelector("section.video");
    if (section) section.style.display = "none";

    const old = document.getElementById("tvp-skrot-container");
    if (old) old.remove();

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

    const loadMoreBtn = document.querySelector(".button-more");
    if (loadMoreBtn) {
      const btnWrapper = document.createElement("div");
      btnWrapper.className = "tvp-load-more";
      btnWrapper.appendChild(loadMoreBtn.cloneNode(true));
      btnWrapper.querySelector(".button-more").addEventListener("click", () => {
        loadMoreBtn.click();
      });
      container.appendChild(btnWrapper);
    }

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

  // ========== INIT ==========
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

    const observer = new MutationObserver(() => {
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

  init();
})();
