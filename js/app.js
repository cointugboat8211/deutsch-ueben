import { onNavigate, navigate } from "./router.js";
import { getState, getLeitnerBox, getDialogueProgress } from "./storage.js";
import { levelLabels } from "./data/assessment-data.js";
import { dialogues } from "./data/dialogue-data.js";
import { readingTiers } from "./data/content-data.js";
import * as assessmentView from "./assessment.js";
import * as conversationView from "./conversation.js";
import * as readingView from "./reading.js";
import * as aiChatView from "./aichat.js";
import * as lessonsView from "./lessons.js";
import { allLessons } from "./data/lessons-data.js";
import { getLessonProgress, getStreak, getXP } from "./storage.js";
import { getDueReviewItems } from "./vocab.js";
import { onVoiceStatus, germanVoices, speechSynthesisSupported } from "./speech.js";

const appEl = document.getElementById("app");

const views = {
  dashboard: renderDashboard,
  assessment: assessmentView.render,
  conversation: conversationView.render,
  reading: readingView.render,
  aichat: aiChatView.render,
  lessons: lessonsView.render,
};

function renderView(view, params = {}) {
  updateNav(view);
  window.scrollTo(0, 0);
  (views[view] || renderDashboard)(appEl, params);
}

function updateNav(view) {
  document.querySelectorAll(".navbtn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.nav === view);
  });
}

document.querySelectorAll(".navbtn").forEach((btn) => {
  btn.addEventListener("click", () => navigate(btn.dataset.nav));
});

onNavigate(renderView);

function renderDashboard(container) {
  const state = getState();
  const hasLevel = !!state.level;
  const levelLabel = hasLevel ? levelLabels[state.level] : "Not assessed yet";

  const completedDialogues = dialogues.filter((d) => getDialogueProgress(d.id).completed).length;
  const allVocab = readingTiers.flatMap((t) => t.categories.flatMap((c) => c.items));
  const knownVocab = allVocab.filter((v) => getLeitnerBox(v.id) >= 2).length;

  container.innerHTML = `
    <h1>Willkommen! 👋</h1>
    <p class="sub">Learn German the way it sticks: by speaking it and reading it.</p>

    <div class="card">
      <div class="row between">
        <div>
          <div class="pill">${levelLabel}</div>
          <p class="sub" style="margin-top:8px;">${
            hasLevel && state.lastAssessment
              ? `Score: ${state.lastAssessment.score}/${state.lastAssessment.total}`
              : "Take a quick placement check so scenarios and reading material match where you're at."
          }</p>
        </div>
        <button class="btn secondary" id="assess-btn">${hasLevel ? "Retake Assessment" : "Take Placement Check"}</button>
      </div>
    </div>

    <button class="big-action" id="lessons-btn" style="width:100%; margin-bottom:16px; border-color:var(--accent);">
      <div class="icon">🎓</div>
      <div class="title">Lessons — learn step by step</div>
      <div class="desc">Short lessons with new words, listening, word-building and speaking practice. ${allLessons.filter((l) => getLessonProgress(l.id)).length}/${allLessons.length} completed · 🔥 ${getStreak()} day streak · ⭐ ${getXP()} XP${getDueReviewItems(1).length ? ` · <strong style="color:var(--accent-2);">${getDueReviewItems(50).length} words due for review</strong>` : ""}</div>
    </button>

    <div class="grid-2">
      <button class="big-action" id="conv-btn">
        <div class="icon">🎙️</div>
        <div class="title">Have a Conversation</div>
        <div class="desc">Talk back and forth in German using your microphone. ${completedDialogues}/${dialogues.length} scenarios completed.</div>
      </button>
      <button class="big-action" id="read-btn">
        <div class="icon">📖</div>
        <div class="title">Read &amp; Translate</div>
        <div class="desc">See German words and sentences with English translations, and hear them pronounced. ${knownVocab}/${allVocab.length} words known.</div>
      </button>
    </div>

    <button class="big-action" id="ai-btn" style="width:100%; margin-top:16px;">
      <div class="icon">🤖</div>
      <div class="title">Free AI Tutor — talk about anything</div>
      <div class="desc">A free AI that runs on your own computer (via Ollama). It chats in German at your level, translates, and corrects you gently. No account or cost.</div>
    </button>
  `;

  container.querySelector("#assess-btn").onclick = () => navigate("assessment", { mode: "intro" });
  container.querySelector("#lessons-btn").onclick = () => navigate("lessons");
  container.querySelector("#conv-btn").onclick = () => navigate("conversation");
  container.querySelector("#read-btn").onclick = () => navigate("reading");
  container.querySelector("#ai-btn").onclick = () => navigate("aichat");
}

renderView("dashboard");

// --- German voice check: warn clearly when the browser has no German voice ---
const notice = document.createElement("div");
notice.id = "voice-notice";
notice.hidden = true;
notice.style.cssText = "background:#3a2a0a;border-bottom:1px solid var(--accent);padding:12px 24px;font-size:.9rem;line-height:1.5;";
notice.innerHTML = `
  <strong>⚠️ No German voice found.</strong> German would be read with an English voice, which teaches the wrong pronunciation.
  <strong>Fix:</strong> open this app in <strong>Microsoft Edge</strong> (it has free, natural German voices; needs internet),
  or in Windows go to <em>Settings → Time &amp; language → Language &amp; region → Add a language → Deutsch</em>, make sure
  <em>Text-to-speech</em> is ticked, then fully restart your browser.
  <button class="btn ghost" id="voice-dismiss">Dismiss</button>`;
appEl.before(notice);
notice.querySelector("#voice-dismiss").onclick = () => {
  notice.hidden = true;
  try { sessionStorage.setItem("voiceNoticeDismissed", "1"); } catch {}
};

if (speechSynthesisSupported()) {
  const dismissed = (() => { try { return sessionStorage.getItem("voiceNoticeDismissed"); } catch { return null; } })();
  // Voices load asynchronously; give the browser a moment before deciding there is none.
  onVoiceStatus((voice) => { notice.hidden = !!voice || !!dismissed; });
  setTimeout(() => { if (!dismissed && !germanVoices().length) notice.hidden = false; }, 2000);
} else {
  notice.querySelector("strong").textContent = "⚠️ This browser can't speak.";
  notice.hidden = false;
}

// --- Installable app: register the offline service worker, and on iPhone
// (which has no install prompt) show a one-time "Add to Home Screen" tip. ---
if ("serviceWorker" in navigator && window.isSecureContext) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}

const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = window.navigator.standalone === true || window.matchMedia("(display-mode: standalone)").matches;
let iosDismissed = false;
try { iosDismissed = localStorage.getItem("iosInstallDismissed") === "1"; } catch {}

if (isIOS && !isStandalone && !iosDismissed) {
  const banner = document.createElement("div");
  banner.style.cssText = "background:#0d2a28;border-bottom:1px solid var(--accent-2);padding:12px 24px;font-size:.9rem;line-height:1.5;";
  banner.innerHTML = `
    📲 <strong>Put this on your Home Screen</strong> so it works like an app (and offline for lessons):
    tap the <strong>Share</strong> button in Safari, then <strong>“Add to Home Screen”</strong>.
    <button class="btn ghost" id="ios-dismiss">Got it</button>`;
  document.querySelector(".topbar").after(banner);
  banner.querySelector("#ios-dismiss").onclick = () => {
    banner.remove();
    try { localStorage.setItem("iosInstallDismissed", "1"); } catch {}
  };
}
