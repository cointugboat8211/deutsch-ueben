// Free, local AI tutor. Talks to Ollama (https://ollama.com) running on this
// computer at localhost:11434. No API key, no cost, works offline.

import { getState } from "./storage.js";
import { learnerVocabulary, wordSet } from "./vocab.js";
import { levelLabels } from "./data/assessment-data.js";
import { speakGerman, speechRecognitionSupported, listenOnce, stopListening, micErrorMessage } from "./speech.js";
import { getOllamaBase, setOllamaBase, isRemoteOllama } from "./remote.js";
import { navigate, showToast } from "./router.js";

export { getOllamaBase, setOllamaBase, isRemoteOllama };

const PREFERRED_MODELS = ["qwen2.5:14b", "gemma3:12b", "gemma2:9b", "qwen2.5:7b", "llama3.1:8b", "qwen2.5:3b", "llama3.2:3b", "mistral"];
const MODEL_KEY = "deutschUeben_model";

const TOPIC_LABELS = { lessons: "My lessons", free: "Free chat", intro: "Introductions", cafe: "At the café", shopping: "Shopping", directions: "Directions", daily: "Daily life" };

const TOPICS = {
  lessons: "the themes of the lessons the learner has recently studied",
  free: "anything the learner wants to talk about",
  intro: "introducing yourself (name, where you're from, how you are)",
  cafe: "ordering food and drinks at a café, including prices and paying",
  shopping: "shopping, prices and numbers",
  directions: "asking for and giving directions in a city",
  daily: "daily routine, hobbies and family",
};

const LEVEL_RULES = {
  beginner: "The learner is a COMPLETE BEGINNER. Use only very simple present-tense sentences of at most 6 words, with the most common words (A1). Ask one easy question at a time.",
  "false-beginner": "The learner is a FALSE BEGINNER. Use short simple present-tense sentences (max 8 words), very common vocabulary, one question at a time.",
  a1: "The learner is A1. Use short, simple sentences (max 10 words), common vocabulary and mostly present tense.",
  a2: "The learner is A2. Use everyday German with simple past/perfect where natural, sentences up to 14 words.",
};

const FUNCTION_WORDS = "ich, du, er, sie, es, wir, ihr, Sie, ist, bin, bist, sind, seid, hat, habe, hast, haben, und, oder, nicht, ein, eine, einen, der, die, das, ja, nein, bitte, danke, wie, was, wo, wer, woher, hier, gut, auch, mit, in, aus, zu";

function vocabBlock(vocab) {
  if (!vocab.total) return "";
  const fmt = (w) => `${w.de}=${w.en}`;
  const fresh = vocab.fresh.length ? `- RECENTLY LEARNED (use these often): ${vocab.fresh.map((w) => w.de).join(", ")}\n` : "";
  const review = vocab.review.length
    ? `- REVIEW WORDS the learner tends to forget (work these into the conversation naturally): ${vocab.review.map(fmt).join("; ")}\n`
    : "";
  return `
THE LEARNER'S VOCABULARY - ${vocab.total} words/phrases they have studied:
${vocab.known.map(fmt).join("; ")}
RULES FOR USING IT:
- Build almost every sentence from these words plus basic grammar words (${FUNCTION_WORDS}). Keep sentences short.
- Immerse them in what they have learned: reuse their words in new combinations and different questions, not just the same sentence.
${fresh}${review}- If you truly need a word that is NOT in their vocabulary, use at most ONE such word per reply, make its meaning obvious from context, and list it in "new_words".`;
}

function systemPrompt(level, topic, vocab) {
  const topicText =
    topic === "lessons"
      ? vocab.recentTopics.length
        ? `the themes of the learner's recent lessons: ${vocab.recentTopics.join(", ")}`
        : "simple everyday small talk"
      : TOPICS[topic];
  return `You are a friendly, patient German conversation tutor for an English speaker.
${LEVEL_RULES[level] || LEVEL_RULES.beginner}
Conversation topic: ${topicText}.
${vocabBlock(vocab)}
Stay in the conversation like a real person: react to what the learner said, then ask a simple follow-up question.
If the learner writes English or is stuck, gently help with the German phrase they need.
The learner's messages come from speech recognition or typing, so ignore punctuation/capitalization slips.
Always answer with ONLY a JSON object with exactly these keys:
{"de": "your German reply", "en": "English translation of your reply", "correction": "if the learner made a clear German mistake, one short friendly English tip showing the corrected German; otherwise an empty string", "new_words": [{"de": "a word you used that is not in their vocabulary", "en": "its English meaning"}]}
"new_words" must be an empty list when every word you used is in their vocabulary.
Never put anything outside the JSON.`;
}

export async function listModels() {
  const res = await fetch(`${getOllamaBase()}/api/tags`, { signal: AbortSignal.timeout(isRemoteOllama() ? 6000 : 2500) });
  if (!res.ok) throw new Error("bad status");
  const data = await res.json();
  return (data.models || []).map((m) => m.name);
}

export function pickModel(installed) {
  const saved = localStorage.getItem(MODEL_KEY);
  if (saved && installed.includes(saved)) return saved;
  for (const p of PREFERRED_MODELS) {
    const hit = installed.find((n) => n === p || n.startsWith(p + "-"));
    if (hit) return hit;
  }
  return installed[0];
}

export async function render(container, params = {}) {
  container.innerHTML = `
    <button class="back-link" id="back">&larr; Back</button>
    <h1>AI Tutor 🤖</h1>
    <p class="sub">Checking for your local AI…</p>`;
  container.querySelector("#back").onclick = () => navigate("dashboard");

  let installed;
  try {
    installed = await listModels();
  } catch {
    return renderSetup(container, "not-running");
  }
  if (!installed.length) return renderSetup(container, "no-model");
  renderChat(container, installed, params);
}

function renderSetup(container, reason) {
  const currentBase = getOllamaBase();
  const remote = isRemoteOllama();
  container.innerHTML = `
    <button class="back-link" id="back">&larr; Back</button>
    <h1>AI Tutor 🤖</h1>
    <p class="sub">A free AI that runs on <em>your</em> computer — no account, no API key, no cost, works offline. One-time setup (about 5 minutes):</p>
    <div class="card">
      <h2>${reason === "no-model" ? "Ollama is running — now download a model" : "1. Install Ollama"}</h2>
      ${
        reason === "no-model"
          ? ""
          : `<p>Download and install it from <a href="https://ollama.com/download" target="_blank" rel="noopener" style="color:var(--accent-2)">ollama.com/download</a> (Windows installer). It then runs quietly in the background.</p>
             <h2 style="margin-top:18px;">2. Download a model</h2>`
      }
      <p>Open PowerShell and run this (about a 4.7 GB one-time download). Your laptop's RTX 4070 handles it easily:</p>
      <pre style="background:var(--panel-2);padding:12px;border-radius:8px;overflow:auto;">ollama pull qwen2.5:7b</pre>
      <p class="sub">Prefer something smaller/faster? <code>ollama pull qwen2.5:3b</code> (1.9 GB) works too, just a bit less accurate.</p>
      <h2 style="margin-top:18px;">${reason === "no-model" ? "Then" : "3. Come back"}</h2>
      <button class="btn" id="retry">I've done it — check again</button>
    </div>
    <div class="card">
      <h2>On this device, use a computer elsewhere</h2>
      <p class="sub">If Ollama is already set up on your own computer and it's reachable over Tailscale (or the same network), enter its address here instead of installing anything on this device.</p>
      <div class="text-fallback">
        <input type="text" id="remote-url" placeholder="https://your-computer.tailXXXXX.ts.net" autocomplete="off" value="${escapeHtml(remote ? currentBase : "")}" />
        <button class="btn" id="connect-remote">Connect</button>
      </div>
      ${remote ? `<p class="sub" style="margin-top:10px;">Currently trying: ${escapeHtml(currentBase)} — <button class="btn ghost" id="use-local" style="padding:0;">use this device's own Ollama instead</button></p>` : ""}
      <p id="remote-status" class="sub" style="margin-top:10px;"></p>
    </div>`;
  container.querySelector("#back").onclick = () => navigate("dashboard");
  container.querySelector("#retry").onclick = () => render(container, {});
  container.querySelector("#use-local")?.addEventListener("click", () => {
    setOllamaBase(null);
    render(container, {});
  });
  container.querySelector("#connect-remote").onclick = async () => {
    const url = container.querySelector("#remote-url").value.trim().replace(/\/+$/, "");
    const status = container.querySelector("#remote-status");
    if (!url) return;
    status.textContent = "Connecting…";
    setOllamaBase(url);
    try {
      const installed = await listModels();
      if (!installed.length) {
        status.textContent = "Connected, but that computer has no AI model downloaded yet.";
        return;
      }
      render(container, {});
    } catch {
      status.textContent = "Couldn't reach that address. Check it's typed correctly and that computer is on and connected.";
      setOllamaBase(null);
    }
  };
}

function renderChat(container, installed, params = {}) {
  const state = getState();
  const level = state.level || "beginner";
  let model = pickModel(installed);
  let vocab = learnerVocabulary();
  let topic = params.topic || (vocab.total ? "lessons" : "free");
  let history = []; // {role:'user'|'assistant', content}
  let log = []; // {who:'npc'|'user'|'system'|'tip', text, en}
  let busy = false;
  let listening = false;

  function shell() {
    container.innerHTML = `
      <button class="back-link" id="back">&larr; Back</button>
      <div class="row between">
        <div><h1 style="margin:0">AI Tutor 🤖</h1>
        <p class="sub" style="margin:4px 0 0;">Level: ${levelLabels[level] || "Complete Beginner"} · model: ${escapeHtml(model)}
          · ${isRemoteOllama() ? `🌐 ${escapeHtml(getOllamaBase().replace(/^https?:\/\//, ""))}` : "💻 this device"}
          <button class="btn ghost" id="change-server" style="padding:0;">change</button></p>
        <p class="sub" style="margin:2px 0 0;" title="${escapeHtml(vocab.review.map((w) => w.de).join(", "))}">${
          vocab.total
            ? `📚 Talking in your ${vocab.total} studied words${vocab.review.length ? ` · bringing back ${vocab.review.length} to review` : ""}`
            : "📚 Finish a lesson and the tutor will start using the words you've learned."
        }</p></div>
        <div class="row">
          <select id="topic" class="btn secondary" style="background:var(--panel-2);">
            ${Object.entries(TOPICS)
              .map(([k]) => `<option value="${k}" ${k === topic ? "selected" : ""}>${TOPIC_LABELS[k]}</option>`)
              .join("")}
          </select>
          <select id="model" class="btn secondary" style="background:var(--panel-2);" title="Which local AI model to use">
            ${installed.map((m) => `<option value="${escapeHtml(m)}" ${m === model ? "selected" : ""}>${escapeHtml(m)}</option>`).join("")}
          </select>
          <button class="btn secondary" id="restart">New chat</button>
        </div>
      </div>
      <div class="card" style="margin-top:16px;">
        <div class="chat-log" id="log"></div>
        <div id="controls"></div>
      </div>`;
    container.querySelector("#back").onclick = () => {
      stopListening();
      navigate("dashboard");
    };
    container.querySelector("#topic").onchange = (e) => {
      topic = e.target.value;
      start();
    };
    container.querySelector("#model").onchange = (e) => {
      model = e.target.value;
      try { localStorage.setItem(MODEL_KEY, model); } catch {}
      start();
    };
    container.querySelector("#restart").onclick = () => start();
    container.querySelector("#change-server").onclick = () => render(container, {});
    drawLog();
    drawControls();
  }

  // Underline words the learner has recently studied or tends to forget.
  function highlight(text) {
    const practiced = wordSet([...vocab.fresh, ...vocab.review]);
    return text
      .split(/([A-Za-zÄÖÜäöüß]+)/)
      .map((part) => (practiced.has(part.toLowerCase()) ? `<mark class="hl">${escapeHtml(part)}</mark>` : escapeHtml(part)))
      .join("");
  }

  function drawLog() {
    const el = container.querySelector("#log");
    el.innerHTML = "";
    log.forEach((m) => {
      const b = document.createElement("div");
      b.className = `bubble ${m.who === "tip" ? "system" : m.who}`;
      if (m.who === "npc") {
        b.innerHTML = `<div>${highlight(m.text)} <button class="speak-btn" style="width:30px;height:30px;font-size:.8rem;vertical-align:middle;" title="Listen">🔊</button></div>
          <div class="translation" style="filter:blur(4px);cursor:pointer;" title="Tap to reveal translation">${escapeHtml(m.en || "")}</div>`;
        b.querySelector(".speak-btn").onclick = () => speakGerman(m.text);
        const tr = b.querySelector(".translation");
        tr.onclick = () => (tr.style.filter = tr.style.filter ? "" : "blur(4px)");
      } else if (m.who === "tip") {
        b.innerHTML = `💡 ${escapeHtml(m.text)}`;
      } else if (m.who === "newword") {
        b.className = "bubble system";
        b.innerHTML = m.words
          .map((w) => `🆕 New word: <strong>${escapeHtml(w.de)}</strong>${w.en ? ` = ${escapeHtml(w.en)}` : ""}`)
          .join("<br>");
      } else {
        b.textContent = m.text;
      }
      el.appendChild(b);
    });
    if (busy) {
      const t = document.createElement("div");
      t.className = "bubble system";
      t.textContent = "Tutor is thinking… (the first reply can take up to a minute while the model loads)";
      el.appendChild(t);
    }
    el.scrollTop = el.scrollHeight;
  }

  function drawControls() {
    const el = container.querySelector("#controls");
    if (!el) return;
    const draft = el.querySelector("#typed")?.value || "";
    el.innerHTML = `
      <div class="row" style="justify-content:center; margin: 8px 0 4px;">
        <button class="mic-btn ${listening ? "listening" : ""}" id="mic" ${speechRecognitionSupported() && !busy ? "" : "disabled"}>🎤</button>
      </div>
      <p class="sub" style="text-align:center;">${listening ? "Listening… speak now" : speechRecognitionSupported() ? "Tap the mic and talk, or type below" : "Speech recognition isn't reliable in Safari — type below"}</p>
      <div class="text-fallback">
        <input type="text" id="typed" placeholder="Schreib etwas… (type in German)" autocomplete="off" />
        <button class="btn" id="send">Send</button>
      </div>`;
    const input = el.querySelector("#typed");
    input.value = draft;
    el.querySelector("#send").onclick = () => send(input.value);
    input.addEventListener("keydown", (e) => e.key === "Enter" && send(input.value));
    const mic = el.querySelector("#mic");
    if (mic) mic.onclick = listen;
    input.focus();
  }

  async function listen() {
    listening = true;
    drawControls();
    const { transcript, error } = await listenOnce({ timeoutMs: 10000 });
    listening = false;
    drawControls();
    if (!transcript) {
      showToast(micErrorMessage(error));
      return;
    }
    send(transcript);
  }

  async function send(text) {
    text = (text || "").trim();
    if (!text) return;
    if (busy) {
      showToast("Tutor is still thinking — send again in a moment");
      return;
    }
    const box = container.querySelector("#typed");
    if (box) box.value = "";
    log.push({ who: "user", text });
    history.push({ role: "user", content: text });
    await getReply();
  }

  async function getReply() {
    busy = true;
    drawLog();
    drawControls();
    try {
      const res = await fetch(`${getOllamaBase()}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(180000),
        body: JSON.stringify({
          model,
          stream: false,
          format: "json",
          options: { temperature: 0.6, num_ctx: 6144 },
          messages: [{ role: "system", content: systemPrompt(level, topic, vocab) }, ...history.slice(-12)],
        }),
      });
      if (!res.ok) throw new Error(`Ollama returned ${res.status}`);
      const data = await res.json();
      const reply = parseReply(data.message?.content || "");
      history.push({ role: "assistant", content: JSON.stringify(reply) });
      if (reply.correction) log.push({ who: "tip", text: reply.correction });
      log.push({ who: "npc", text: reply.de, en: reply.en });
      if (reply.newWords.length) log.push({ who: "newword", words: reply.newWords });
      busy = false;
      drawLog();
      drawControls();
      speakGerman(reply.de);
    } catch (e) {
      busy = false;
      log.push({ who: "system", text: "Couldn't reach the AI. Is Ollama still running? (" + (e.message || e) + ")" });
      drawLog();
      drawControls();
    }
  }

  function start() {
    history = [];
    log = [];
    vocab = learnerVocabulary();
    shell();
    history.push({ role: "user", content: "(The learner just arrived. Greet them in German and ask a first simple question about the topic.)" });
    getReply();
  }

  start();
}

function parseReply(raw) {
  try {
    const obj = JSON.parse(raw);
    const newWords = (Array.isArray(obj.new_words) ? obj.new_words : [])
      .map((w) => ({ de: String(w?.de ?? "").trim(), en: String(w?.en ?? "").trim() }))
      .filter((w) => w.de)
      .slice(0, 2);
    return {
      de: String(obj.de || "").trim() || "Entschuldigung, wie bitte?",
      en: String(obj.en || "").trim(),
      correction: String(obj.correction || "").trim(),
      newWords,
    };
  } catch {
    return { de: raw.trim() || "Entschuldigung, wie bitte?", en: "", correction: "", newWords: [] };
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
