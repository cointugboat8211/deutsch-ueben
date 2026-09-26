import {
  createAdaptiveTest,
  TOTAL_QUESTIONS,
  MIN_D,
  MAX_D,
  DIFFICULTY_LABELS,
  levelLabels,
  levelDescriptions,
} from "./data/assessment-data.js";
import { setAssessmentResult } from "./storage.js";
import { speakGerman, speechSynthesisSupported } from "./speech.js";
import { findModel, generateQuestion } from "./aiquestions.js";
import { navigate } from "./router.js";

export function render(container, params = {}) {
  const mode = params.mode || "intro";
  if (mode === "intro") return renderIntro(container);
  if (mode === "quiz") return renderQuiz(container, params.useAI);
  if (mode === "result") return renderResult(container, params.result);
}

function renderIntro(container) {
  container.innerHTML = `
    <button class="back-link" id="back">&larr; Back to dashboard</button>
    <h1>Find Your Level</h1>
    <p class="sub">${TOTAL_QUESTIONS} questions that adapt to you. It starts easy and gets harder each time you're right; when you miss one, it eases back a step. The point where it starts to feel hard is your level. A few questions are spoken aloud, and some ask you to type German, so turn your sound on.</p>
    <div class="card">
      <p>Not sure? Tap <strong>I don't know</strong> instead of guessing. It gives the most accurate result. You can retake it anytime and the questions will be different.</p>
      <label id="ai-row" class="row" style="margin:14px 0; opacity:.6; gap:10px; align-items:flex-start;">
        <input type="checkbox" id="use-ai" disabled style="margin-top:4px;" />
        <span><strong>Let the AI tutor write some of the questions</strong><br />
          <span class="sub" id="ai-status">Checking for your local AI…</span></span>
      </label>
      <button class="btn" id="start">Start</button>
    </div>
  `;
  container.querySelector("#back").onclick = () => navigate("dashboard");
  container.querySelector("#start").onclick = () =>
    navigate("assessment", { mode: "quiz", useAI: container.querySelector("#use-ai").checked });

  findModel().then((model) => {
    const status = container.querySelector("#ai-status");
    if (!status) return; // user navigated away
    if (model) {
      container.querySelector("#use-ai").disabled = false;
      container.querySelector("#ai-row").style.opacity = 1;
      status.textContent = `Available (${model}). More variety, but small AI models occasionally make German mistakes. Off by default.`;
    } else {
      status.textContent = "Not available. Ollama isn't running or has no model yet (see the AI Tutor page).";
    }
  });
}

function renderQuiz(container, useAI) {
  const test = createAdaptiveTest();
  const aiPrompts = [];
  let model = null;
  let q = null;

  async function nextQuestion() {
    const pct = Math.round((test.asked / TOTAL_QUESTIONS) * 100);
    // With AI on, roughly every other question is model-written.
    if (useAI && model && Math.random() < 0.5) {
      container.innerHTML = shell(pct, `<p class="sub">Writing your next question…</p>`);
      const raw = await generateQuestion(model, test.difficulty, aiPrompts);
      if (raw) {
        aiPrompts.push(raw.prompt);
        q = test.nextFromRaw(raw);
        return draw();
      }
    }
    q = test.next();
    draw();
  }

  function shell(pct, body) {
    return `
      <div class="row between">
        <span class="pill">Question ${Math.min(test.asked + 1, TOTAL_QUESTIONS)} / ${TOTAL_QUESTIONS}</span>
      </div>
      <div class="progressbar" style="margin: 10px 0 20px;"><div style="width:${pct}%"></div></div>
      <div class="card">${body}</div>`;
  }

  function draw() {
    const pct = Math.round((test.asked / TOTAL_QUESTIONS) * 100);
    const heading =
      q.type === "listen"
        ? `<p class="sub" style="margin-bottom: 14px;">Listen to the word, then choose the answer:</p>
           <div class="row" style="margin-bottom: 14px;">
             <button class="speak-btn" id="play" title="Play again">🔊</button>
             <span class="sub">Tap to hear it again</span>
           </div>`
        : `<h2>${escapeHtml(q.prompt)}</h2>`;
    const typedUi =
      q.type === "typed"
        ? `<div class="text-fallback"><input type="text" id="typed-answer" placeholder="Your German answer…" autocomplete="off" /><button class="btn" id="submit-typed">Submit</button></div>
           <button class="btn ghost" id="dont-know">I don't know</button>`
        : "";
    container.innerHTML = shell(pct, `${heading}<div id="options"></div>${typedUi}`);

    if (q.type === "listen" && speechSynthesisSupported()) {
      container.querySelector("#play")?.addEventListener("click", () => speakGerman(q.prompt));
      speakGerman(q.prompt);
    }

    if (q.type === "typed") {
      const input = container.querySelector("#typed-answer");
      input.focus();
      container.querySelector("#submit-typed").onclick = () => answer(input.value);
      container.querySelector("#dont-know").onclick = () => answer("");
      input.addEventListener("keydown", (e) => e.key === "Enter" && answer(input.value));
      return;
    }

    const optionsEl = container.querySelector("#options");
    q.options.forEach((opt, i) => {
      const btn = document.createElement("button");
      btn.className = "q-option";
      btn.textContent = opt;
      btn.onclick = () => choose(i, optionsEl);
      optionsEl.appendChild(btn);
    });
    const dk = document.createElement("button");
    dk.className = "btn ghost";
    dk.textContent = "I don't know";
    dk.onclick = () => choose(-1, optionsEl);
    optionsEl.appendChild(dk);
  }

  function choose(index, optionsEl) {
    Array.from(optionsEl.children).forEach((b, i) => {
      b.disabled = true;
      if (i === q.correct) b.classList.add("correct");
      else if (i === index) b.classList.add("incorrect");
    });
    setTimeout(() => answer(index), 550);
  }

  function answer(value) {
    const { done } = test.record(q, value);
    if (done) {
      const result = test.result();
      setAssessmentResult(result);
      navigate("assessment", { mode: "result", result });
    } else {
      nextQuestion();
    }
  }

  (async () => {
    if (useAI) model = await findModel();
    nextQuestion();
  })();
}

function renderResult(container, result) {
  if (!result) {
    navigate("dashboard");
    return;
  }
  const catLabels = {
    greetings: "greetings",
    numbers: "numbers and prices",
    articles: "der/die/das articles",
    pronouns: "pronouns",
    verbs: "verb conjugation",
    vocab: "vocabulary",
    "word-order": "sentence word order",
    cafe: "café phrases",
    phrases: "everyday phrases",
    grammar: "grammar",
    typed: "writing German from memory",
    general: "general knowledge",
  };

  // The "line": where correct answers turn into misses.
  const line = Math.round(result.estimate * 10) / 10;
  const rows = [];
  for (let d = MIN_D; d <= MAX_D; d++) {
    const s = result.byLevel?.[d];
    const pct = s ? Math.round((s.correct / s.total) * 100) : 0;
    const color = !s ? "var(--border)" : pct >= 67 ? "var(--good)" : pct >= 34 ? "var(--accent)" : "var(--bad)";
    const isLine = Math.round(result.estimate) === d;
    rows.push(`
      <div style="display:grid; grid-template-columns: 24px 1fr 90px; gap:10px; align-items:center; margin:8px 0; ${isLine ? "font-weight:700;" : ""}">
        <span class="pill" style="padding:2px 8px;">${d}</span>
        <div>
          <div style="font-size:.9rem;">${DIFFICULTY_LABELS[d]} ${isLine ? "← your line" : ""}</div>
          <div class="progressbar" style="margin-top:4px;"><div style="width:${s ? Math.max(pct, 4) : 0}%; background:${color};"></div></div>
        </div>
        <span class="sub" style="text-align:right;">${s ? `${s.correct}/${s.total} right` : "not reached"}</span>
      </div>`);
  }

  container.innerHTML = `
    <h1>${levelLabels[result.level]}</h1>
    <div class="card">
      <p>${levelDescriptions[result.level]}</p>
      <p class="sub">Your line is around <strong>level ${line}</strong> of ${MAX_D}. Below it you're answering correctly; above it things get shaky.</p>
      ${rows.join("")}
      <p class="sub">Score: ${result.score} / ${result.total} · Typing German from memory: ${result.typedCorrect ?? 0} / ${result.typedTotal ?? 0} correct.</p>
      ${
        result.weakCategories.length
          ? `<p class="sub">Areas to focus on: ${result.weakCategories.map((c) => catLabels[c] || c).join(", ")}.</p>`
          : ""
      }
    </div>
    <div class="row">
      <button class="btn" id="go-dash">Go to Dashboard</button>
      <button class="btn secondary" id="retake">Retake</button>
    </div>
  `;
  container.querySelector("#go-dash").onclick = () => navigate("dashboard");
  container.querySelector("#retake").onclick = () => navigate("assessment", { mode: "intro" });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
