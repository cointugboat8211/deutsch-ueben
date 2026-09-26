import { dialogues, getDialogue } from "./data/dialogue-data.js";
import { getState, getDialogueProgress, setDialogueProgress } from "./storage.js";
import {
  speakGerman,
  speechRecognitionSupported,
  listenOnce,
  stopListening,
  matchesExpected,
} from "./speech.js";
import { navigate, showToast } from "./router.js";

const tierLabels = { beginner: "Beginner", a1: "A1", a2: "A2" };

export function render(container, params = {}) {
  const mode = params.mode || "list";
  if (mode === "play") return renderPlay(container, params.dialogueId);
  return renderList(container);
}

function renderList(container) {
  const state = getState();
  const recommendedTier = state.level === "a2" ? "a2" : state.level === "a1" ? "a1" : "beginner";

  container.innerHTML = `
    <h1>Have a Conversation</h1>
    <p class="sub">Pick a scenario. Your browser will speak the German lines aloud; you reply out loud using your microphone (or type, if you'd rather).</p>
    ${!speechRecognitionSupported() ? `<div class="card"><p><strong>Heads up:</strong> your browser doesn't support speech recognition, so you'll type your replies instead. Speech recognition currently works best in Chrome or Edge.</p></div>` : ""}
    <div id="scenarios"></div>
  `;

  const listEl = container.querySelector("#scenarios");
  dialogues.forEach((d) => {
    const progress = getDialogueProgress(d.id);
    const isRecommended = d.tier === recommendedTier;
    const card = document.createElement("div");
    card.className = "scenario-card";
    card.innerHTML = `
      <div>
        <div class="row">
          <strong>${d.title}</strong>
          <span class="pill">${tierLabels[d.tier]}</span>
          ${isRecommended ? `<span class="pill" style="color:var(--good)">Suggested</span>` : ""}
          ${progress.completed ? `<span class="pill" style="color:var(--accent-2)">✓ Done</span>` : ""}
        </div>
        <div class="sub">${d.titleEn} — ${d.description}</div>
      </div>
      <button class="btn secondary start-btn">Start</button>
    `;
    card.querySelector(".start-btn").onclick = () => navigate("conversation", { mode: "play", dialogueId: d.id });
    listEl.appendChild(card);
  });
}

function renderPlay(container, dialogueId) {
  const dialogue = getDialogue(dialogueId);
  if (!dialogue) {
    navigate("conversation");
    return;
  }

  const log = [];
  let currentNodeId = dialogue.startNode;
  let attempts = 0;
  let showHint = false;
  let listening = false;

  function draw() {
    container.innerHTML = `
      <button class="back-link" id="back">&larr; Back to scenarios</button>
      <h1>${dialogue.title}</h1>
      <p class="sub">${dialogue.titleEn}</p>
      <div class="card">
        <div class="chat-log" id="log"></div>
        <div id="controls"></div>
      </div>
    `;
    container.querySelector("#back").onclick = () => {
      stopListening();
      navigate("conversation");
    };

    const logEl = container.querySelector("#log");
    log.forEach((entry) => logEl.appendChild(renderBubble(entry)));
    logEl.scrollTop = logEl.scrollHeight;

    renderControls(container.querySelector("#controls"));
  }

  function renderBubble({ who, text, en }) {
    const div = document.createElement("div");
    div.className = `bubble ${who}`;
    div.innerHTML = `<div>${escapeHtml(text)}</div>${en ? `<div class="translation">${escapeHtml(en)}</div>` : ""}`;
    return div;
  }

  function appendAndDraw(entry) {
    log.push(entry);
    draw();
  }

  function currentNode() {
    return dialogue.nodes[currentNodeId];
  }

  function enterNode() {
    if (currentNodeId === "end") {
      setDialogueProgress(dialogue.id, { completed: true, lastNode: "end" });
      log.push({ who: "system", text: "Conversation complete! 🎉" });
      draw();
      return;
    }
    const node = currentNode();
    attempts = 0;
    showHint = false;
    log.push({ who: "npc", text: node.npc, en: node.npcEn });
    setDialogueProgress(dialogue.id, { completed: false, lastNode: node.id });
    draw();
    speakGerman(node.npc);
  }

  function renderControls(el) {
    if (currentNodeId === "end") {
      el.innerHTML = `
        <div class="row">
          <button class="btn" id="restart">Try Again</button>
          <button class="btn secondary" id="more">More Scenarios</button>
        </div>
      `;
      el.querySelector("#restart").onclick = () => {
        log.length = 0;
        currentNodeId = dialogue.startNode;
        enterNode();
      };
      el.querySelector("#more").onclick = () => navigate("conversation");
      return;
    }

    const node = currentNode();

    if (!node.responses) {
      el.innerHTML = `<div class="row end"><button class="btn" id="continue">Continue</button></div>`;
      el.querySelector("#continue").onclick = () => {
        currentNodeId = node.next;
        enterNode();
      };
      return;
    }

    const hintText = node.responses.map((r) => r.label).join("  ·  ");

    el.innerHTML = `
      ${showHint ? `<div class="bubble system" style="margin-bottom:12px;">💡 ${escapeHtml(hintText)}</div>` : ""}
      <div class="row" style="justify-content:center; margin: 8px 0 4px;">
        <button class="mic-btn ${listening ? "listening" : ""}" id="mic" ${speechRecognitionSupported() ? "" : "disabled"} title="Hold to speak">🎤</button>
      </div>
      <p class="sub" style="text-align:center;">${listening ? "Listening… speak now" : speechRecognitionSupported() ? "Tap the mic and speak your reply in German" : "Speech recognition isn't available in this browser"}</p>
      <div class="text-fallback">
        <input type="text" id="typed" placeholder="Or type your reply in German…" />
        <button class="btn secondary" id="send">Send</button>
      </div>
      <div class="row" style="margin-top: 12px;">
        <button class="btn ghost" id="replay">🔊 Replay</button>
        <button class="btn ghost" id="hint">${showHint ? "Hide" : "Show"} hint</button>
        <button class="btn ghost" id="skip">Skip</button>
      </div>
    `;

    el.querySelector("#replay").onclick = () => speakGerman(node.npc);
    el.querySelector("#hint").onclick = () => {
      showHint = !showHint;
      renderControls(el);
    };
    el.querySelector("#skip").onclick = () => {
      stopListening();
      currentNodeId = node.responses[0].next;
      log.push({ who: "system", text: `(skipped — example: "${node.responses[0].variants[0]}")` });
      enterNode();
    };
    el.querySelector("#send").onclick = () => submitText(node, el.querySelector("#typed").value);
    el.querySelector("#typed").addEventListener("keydown", (e) => {
      if (e.key === "Enter") submitText(node, e.target.value);
    });

    const micBtn = el.querySelector("#mic");
    if (micBtn && speechRecognitionSupported()) {
      micBtn.onclick = () => startListening(node);
    }
  }

  async function startListening(node) {
    listening = true;
    renderControls(container.querySelector("#controls"));
    const { transcript, error } = await listenOnce({ timeoutMs: 8000 });
    listening = false;
    if (!transcript) {
      renderControls(container.querySelector("#controls"));
      showToast(error === "no-speech" || error === "timeout" ? "Didn't catch that — try again" : "Mic error — try typing instead");
      return;
    }
    handleUserAttempt(node, transcript);
  }

  function submitText(node, text) {
    if (!text || !text.trim()) return;
    handleUserAttempt(node, text.trim());
  }

  function handleUserAttempt(node, text) {
    log.push({ who: "user", text });
    const matched = node.responses.find((r) => matchesExpected(text, r.variants));
    if (matched) {
      currentNodeId = matched.next;
      enterNode();
      return;
    }
    attempts++;
    if (attempts >= 2) showHint = true;
    log.push({ who: "system", text: attempts >= 2 ? "Not quite — check the hint below, or tap Skip." : "Hmm, that didn't match. Try again?" });
    draw();
  }

  enterNode();
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
