import {
  germanVoices,
  getSelectedVoice,
  setSelectedVoice,
  getSpeechRate,
  setSpeechRate,
  speakGerman,
  onVoiceStatus,
} from "./speech.js";
import { navigate } from "./router.js";

const SAMPLE = "Guten Tag! Wie geht es Ihnen heute? Ich freue mich, mit Ihnen Deutsch zu üben.";

export function render(container) {
  draw(container);
  // Voices can finish loading asynchronously after the page first draws.
  onVoiceStatus(() => draw(container));
}

function draw(container) {
  const voices = germanVoices();
  const selected = getSelectedVoice();
  const rate = getSpeechRate();

  container.innerHTML = `
    <button class="back-link" id="back">&larr; Back to dashboard</button>
    <h1>Voice 🔊</h1>
    <p class="sub">If German speech sounds robotic, it's almost always because of <em>which voice</em> got picked, not the app. Pick a better one here — this changes every page that speaks German.</p>

    ${
      !voices.length
        ? `<div class="card"><p><strong>No German voice found on this device.</strong> See the banner at the top of the app for how to add one.</p></div>`
        : `<div class="card">
             <h2>Available voices (${voices.length})</h2>
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

    <div class="card">
      <h2>Getting a better voice</h2>
      <p class="sub">Every voice you see above comes from your browser and operating system — the app just picks from what's installed. To get a genuinely natural-sounding one:</p>
      <ul class="sub" style="padding-left:20px; line-height:1.7;">
        <li><strong>Easiest: use Microsoft Edge.</strong> It includes free "Online (Natural)" German voices that sound close to human. Needs an internet connection.</li>
        <li><strong>Or add a Natural voice to Windows:</strong> Settings → Time &amp; language → Speech → Manage voices → Add voices → German. Look for one whose name says <em>Natural</em> — those are the modern neural voices; plain "German" entries are the older, more robotic kind.</li>
      </ul>
    </div>
  `;

  container.querySelector("#back").onclick = () => navigate("dashboard");

  const listEl = container.querySelector("#voice-list");
  voices.forEach((v) => {
    const row = document.createElement("div");
    row.className = "word-row";
    row.style.marginBottom = "8px";
    const isSelected = selected && v.name === selected.name;
    row.innerHTML = `
      <button class="speak-btn" title="Preview">▶</button>
      <span class="de">${escapeHtml(v.name)}</span>
      <span class="sub" style="margin-left:8px;">${escapeHtml(v.lang)}</span>
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

  const rateInput = container.querySelector("#rate");
  rateInput?.addEventListener("input", (e) => {
    container.querySelector("#rate-label").textContent = `${parseFloat(e.target.value).toFixed(2)}×`;
  });
  rateInput?.addEventListener("change", (e) => {
    const r = parseFloat(e.target.value);
    setSpeechRate(r);
    speakGerman(SAMPLE, { rate: r });
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
