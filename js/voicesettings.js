import {
  germanVoices,
  allSystemVoices,
  getSelectedVoice,
  setSelectedVoice,
  getSpeechRate,
  setSpeechRate,
  speakGerman,
  onVoiceStatus,
} from "./speech.js";
import { navigate } from "./router.js";

const SAMPLE = "Guten Tag! Wie geht es Ihnen heute? Ich freue mich, mit Ihnen Deutsch zu üben.";

// The Web Speech API doesn't expose a gender field, so this guesses from the
// voice's given name — covers the common Microsoft/Google/Apple German (and
// general) voice names. Falls back to "unknown" rather than a wrong guess.
const MALE_NAMES = ["stefan", "conrad", "klaus", "david", "mark", "guy", "henri", "diego", "pablo", "luca", "matteo", "felix", "martin", "markus", "friedrich", "johann", "georg", "yannick", "daniel", "reed", "thomas"];
const FEMALE_NAMES = ["hedda", "katja", "petra", "vicki", "zira", "aria", "jenny", "amala", "elsa", "emma", "ingrid", "sabine", "anna", "maria", "clara", "sophie", "helena", "nicole", "susan", "karen", "samantha", "victoria"];

function guessGender(name) {
  const n = name.toLowerCase();
  if (MALE_NAMES.some((m) => n.includes(m))) return "male";
  if (FEMALE_NAMES.some((f) => n.includes(f))) return "female";
  return null;
}

let filter = "all"; // "all" | "male" | "female"

export function render(container) {
  filter = "all";
  draw(container);
  // Voices can finish loading asynchronously after the page first draws.
  onVoiceStatus(() => draw(container));
}

function draw(container) {
  const allVoices = germanVoices();
  const withGender = allVoices.map((v) => ({ v, gender: guessGender(v.name) }));
  const maleCount = withGender.filter((x) => x.gender === "male").length;
  const femaleCount = withGender.filter((x) => x.gender === "female").length;
  const voices = filter === "all" ? withGender : withGender.filter((x) => x.gender === filter);

  const selected = getSelectedVoice();
  const rate = getSpeechRate();
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const everyVoice = allSystemVoices();

  container.innerHTML = `
    <button class="back-link" id="back">&larr; Back to dashboard</button>
    <h1>Voice 🔊</h1>
    <p class="sub">If German speech sounds robotic, it's almost always because of <em>which voice</em> got picked, not the app. Pick a better one here — this changes every page that speaks German.</p>

    ${
      !allVoices.length
        ? `<div class="card"><p><strong>No German voice found on this device.</strong> See the banner at the top of the app for how to add one.</p></div>`
        : `<div class="card">
             <div class="row between" style="margin-bottom:12px;">
               <h2 style="margin:0;">Available voices (${allVoices.length})</h2>
               ${
                 maleCount && femaleCount
                   ? `<div class="tabs" style="margin:0;">
                        <button class="tab ${filter === "all" ? "active" : ""}" data-filter="all">All</button>
                        <button class="tab ${filter === "male" ? "active" : ""}" data-filter="male">♂ Male (${maleCount})</button>
                        <button class="tab ${filter === "female" ? "active" : ""}" data-filter="female">♀ Female (${femaleCount})</button>
                      </div>`
                   : ""
               }
             </div>
             <div id="voice-list"></div>
           </div>
           <div class="card">
             <h2>Speaking speed</h2>
             <div class="row">
               <input type="range" id="rate" min="0.6" max="1.15" step="0.01" value="${rate}" style="flex:1;" />
               <span class="pill" id="rate-label">${rate.toFixed(2)}×</span>
             </div>
             <p class="sub">Slower can be easier to follow while learning; 1.0 is a natural pace.</p>
           </div>`
    }

    ${
      allVoices.length <= 1
        ? `<div class="card">
             <h2>Only ${allVoices.length} German voice${allVoices.length === 1 ? "" : "s"} found</h2>
             <p class="sub">${
               isIOS
                 ? "On iPhone, iOS ships with just one or two German voices by default — more are free to download."
                 : "This device/browser is only reporting one to the app — more may be available to install."
             }</p>
             ${
               isIOS
                 ? `<p class="sub">Go to <strong>Settings → Accessibility → Spoken Content → Voices → Deutsch</strong> and download more — there's usually a male option (e.g. "Markus") alongside the female ones. Come back and reload this page afterward.</p>`
                 : `<p class="sub">See "Getting a better voice" below.</p>`
             }
             <button class="btn ghost" id="toggle-diag" style="padding:6px 0;">Show every voice this browser reports (${everyVoice.length} total, any language)</button>
             <div id="diag-list" hidden style="margin-top:10px;"></div>
           </div>`
        : ""
    }

    <div class="card">
      <h2>Getting a better voice</h2>
      <p class="sub">Every voice you see above comes from your browser and operating system — the app just picks from what's installed. To get a genuinely natural-sounding one:</p>
      <ul class="sub" style="padding-left:20px; line-height:1.7;">
        ${
          isIOS
            ? `<li><strong>Settings → Accessibility → Spoken Content → Voices → Deutsch</strong> — download an additional voice (male and female options are usually both available). Enhanced/Premium quality voices sound far less robotic than the Default ones.</li>`
            : `<li><strong>Easiest: use Microsoft Edge.</strong> It includes free "Online (Natural)" German voices that sound close to human. Needs an internet connection.</li>
               <li><strong>Or add a Natural voice to Windows:</strong> Settings → Time &amp; language → Speech → Manage voices → Add voices → German. Look for one whose name says <em>Natural</em> — those are the modern neural voices; plain "German" entries are the older, more robotic kind. Microsoft's German Natural pair is usually <strong>Katja</strong> (female) and <strong>Conrad</strong> (male).</li>`
        }
      </ul>
    </div>
  `;

  container.querySelector("#back").onclick = () => navigate("dashboard");
  container.querySelectorAll("[data-filter]").forEach((btn) => {
    btn.onclick = () => {
      filter = btn.dataset.filter;
      draw(container);
    };
  });
  container.querySelector("#toggle-diag")?.addEventListener("click", (e) => {
    const list = container.querySelector("#diag-list");
    const show = list.hidden;
    list.hidden = !show;
    e.target.textContent = show
      ? "Hide the full voice list"
      : `Show every voice this browser reports (${everyVoice.length} total, any language)`;
    if (show) {
      list.innerHTML = everyVoice.length
        ? everyVoice.map((v) => `<div class="sub" style="padding:2px 0;">${escapeHtml(v.name)} — <code>${escapeHtml(v.lang)}</code></div>`).join("")
        : `<p class="sub">This browser reports no voices at all.</p>`;
    }
  });

  const listEl = container.querySelector("#voice-list");
  if (voices.length === 0 && filter !== "all") {
    listEl.innerHTML = `<p class="sub">No ${filter} voice detected by name. It might still be one of the "All" voices — the guess isn't perfect.</p>`;
  }
  voices.forEach(({ v, gender }) => {
    const row = document.createElement("div");
    row.className = "word-row";
    row.style.marginBottom = "8px";
    const isSelected = selected && v.name === selected.name;
    const genderBadge = gender ? `<span class="pill" style="margin-left:8px;">${gender === "male" ? "♂ Male" : "♀ Female"}</span>` : "";
    row.innerHTML = `
      <button class="speak-btn" title="Preview">▶</button>
      <span class="de">${escapeHtml(v.name)}</span>
      <span class="sub" style="margin-left:8px;">${escapeHtml(v.lang)}</span>
      ${genderBadge}
      <span style="margin-left:auto;">${
        isSelected ? `<span class="pill" style="color:var(--good);">✓ In use</span>` : `<button class="btn secondary" data-use style="padding:6px 14px;">Use this</button>`
      }</span>`;
    row.querySelector(".speak-btn").onclick = () => speakGerman(SAMPLE, { voice: v, rate: getSpeechRate() });
    row.querySelector("[data-use]")?.addEventListener("click", () => {
      setSelectedVoice(v.name);
      draw(container);
    });
    listEl?.appendChild(row);
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
