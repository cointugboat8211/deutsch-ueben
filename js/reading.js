import { readingTiers } from "./data/content-data.js";
import { getState, getLeitnerBox, markVocab } from "./storage.js";
import { speakGerman, speechSynthesisSupported } from "./speech.js";
import { navigate } from "./router.js";
import { numberToGerman, priceToGerman } from "./numbers.js";

export function render(container, params = {}) {
  const mode = params.mode || "browse";
  if (mode === "flashcards") return renderFlashcards(container, params.tierId);
  if (mode === "numbers") return renderNumbersDrill(container, params.kind || "prices");
  return renderBrowse(container, params.tierId);
}

function recommendedTierId() {
  const state = getState();
  if (state.level === "a2") return "a2";
  if (state.level === "a1" || state.level === "false-beginner") return "a1";
  return "beginner";
}

function renderBrowse(container, tierId) {
  const activeTier = tierId || recommendedTierId();

  container.innerHTML = `
    <h1>Read &amp; Translate</h1>
    <p class="sub">Tap any word or sentence to reveal its meaning, or tap 🔊 to hear it pronounced. Mark items you know so review focuses on the rest.</p>
    <div class="tabs" id="tabs"></div>
    <div class="row" style="margin-bottom:16px;">
      <button class="btn" id="flashcards">🔁 Practice Flashcards</button>
      <button class="btn secondary" id="numbers">🔢 Numbers &amp; Prices Drill</button>
    </div>
    <div id="categories"></div>
  `;

  const tabsEl = container.querySelector("#tabs");
  readingTiers.forEach((tier) => {
    const tab = document.createElement("button");
    tab.className = "tab" + (tier.id === activeTier ? " active" : "");
    tab.textContent = tier.label;
    tab.onclick = () => renderBrowse(container, tier.id);
    tabsEl.appendChild(tab);
  });

  container.querySelector("#numbers").onclick = () => navigate("reading", { mode: "numbers", kind: "prices" });
  container.querySelector("#flashcards").onclick = () => navigate("reading", { mode: "flashcards", tierId: activeTier });

  const tier = readingTiers.find((t) => t.id === activeTier) || readingTiers[0];
  const catsEl = container.querySelector("#categories");
  tier.categories.forEach((cat) => {
    const section = document.createElement("div");
    section.className = "card";
    section.innerHTML = `<h2>${cat.label}</h2>`;
    const list = document.createElement("div");
    list.className = "word-list";
    cat.items.forEach((item) => list.appendChild(renderWordRow(item)));
    section.appendChild(list);
    catsEl.appendChild(section);
  });
}

function renderWordRow(item) {
  const row = document.createElement("div");
  row.className = "word-row";
  const box = getLeitnerBox(item.id);
  const statusClass = box >= 2 ? "known" : box === 1 ? "learning" : "";

  row.innerHTML = `
    <button class="speak-btn" title="Listen">🔊</button>
    <span class="de">${escapeHtml(item.de)}</span>
    <span class="en" title="Tap to reveal">${escapeHtml(item.en)}</span>
    <span class="status ${statusClass}" title="Progress"></span>
  `;

  row.querySelector(".speak-btn").onclick = () => speakGerman(item.de);
  const enEl = row.querySelector(".en");
  enEl.onclick = () => {
    const revealed = enEl.classList.toggle("revealed");
    if (revealed) markVocab(item.id, true);
    row.querySelector(".status").className = `status ${getLeitnerBox(item.id) >= 2 ? "known" : "learning"}`;
  };

  return row;
}

function renderFlashcards(container, tierId) {
  const tier = readingTiers.find((t) => t.id === tierId) || readingTiers[0];
  const allItems = tier.categories.flatMap((c) => c.items);
  const dueItems = allItems.filter((i) => getLeitnerBox(i.id) < 3);
  const queue = (dueItems.length ? dueItems : allItems).slice();
  let index = 0;
  let flipped = false;

  function draw() {
    if (index >= queue.length) {
      container.innerHTML = `
        <button class="back-link" id="back">&larr; Back to reading list</button>
        <h1>Nice work! 🎉</h1>
        <p class="sub">You reviewed ${queue.length} item${queue.length === 1 ? "" : "s"} from ${tier.label}.</p>
        <div class="row">
          <button class="btn" id="again">Review Again</button>
          <button class="btn secondary" id="browse">Back to List</button>
        </div>
      `;
      container.querySelector("#back").onclick = () => navigate("reading", { tierId: tier.id });
      container.querySelector("#browse").onclick = () => navigate("reading", { tierId: tier.id });
      container.querySelector("#again").onclick = () => renderFlashcards(container, tier.id);
      return;
    }

    const item = queue[index];
    const pct = Math.round((index / queue.length) * 100);

    container.innerHTML = `
      <button class="back-link" id="back">&larr; Back to reading list</button>
      <div class="row between">
        <span class="pill">${tier.label} — ${index + 1} / ${queue.length}</span>
      </div>
      <div class="progressbar" style="margin: 10px 0 20px;"><div style="width:${pct}%"></div></div>
      <div class="flashcard" id="card">
        <div class="de">${escapeHtml(item.de)}</div>
        ${flipped ? `<div class="en">${escapeHtml(item.en)}</div>` : `<div class="hint">Tap card to reveal meaning</div>`}
      </div>
      <div class="row" style="justify-content:center; margin: 16px 0;">
        <button class="speak-btn" id="speak" title="Listen">🔊</button>
      </div>
      ${
        flipped
          ? `<div class="row" style="justify-content:center;">
               <button class="btn secondary" id="again-btn">Still Learning</button>
               <button class="btn" id="know-btn">I Know This</button>
             </div>`
          : ""
      }
    `;

    container.querySelector("#back").onclick = () => navigate("reading", { tierId: tier.id });
    container.querySelector("#speak").onclick = () => speakGerman(item.de);
    container.querySelector("#card").onclick = () => {
      flipped = !flipped;
      draw();
    };

    if (flipped) {
      container.querySelector("#again-btn").onclick = (e) => {
        e.stopPropagation();
        markVocab(item.id, false);
        index++;
        flipped = false;
        draw();
      };
      container.querySelector("#know-btn").onclick = (e) => {
        e.stopPropagation();
        markVocab(item.id, true);
        index++;
        flipped = false;
        draw();
      };
    }

    if (speechSynthesisSupported()) speakGerman(item.de);
  }

  draw();
}

// Listening drill: hear a number or price in German, type what you heard.
function renderNumbersDrill(container, kind) {
  let round = 0;
  let correctCount = 0;
  const ROUNDS = 10;
  let answer = null;
  let spoken = "";

  function newQuestion() {
    if (kind === "prices") {
      const euros = Math.floor(Math.random() * 15) + 1;
      const cents = [0, 20, 30, 50, 80, 90][Math.floor(Math.random() * 6)];
      answer = euros + cents / 100;
      spoken = priceToGerman(euros, cents);
    } else {
      const n = Math.floor(Math.random() * 99) + 1;
      answer = n;
      spoken = numberToGerman(n);
    }
  }

  function parseGuess(str) {
    const n = parseFloat(String(str).replace(",", ".").replace(/[^0-9.]/g, ""));
    return isNaN(n) ? null : n;
  }

  function draw(feedback = "") {
    if (round >= ROUNDS) {
      container.innerHTML = `
        <button class="back-link" id="back">&larr; Back to reading list</button>
        <h1>Done! ${correctCount} / ${ROUNDS} correct</h1>
        <div class="row">
          <button class="btn" id="again">Go Again</button>
          <button class="btn secondary" id="switch">${kind === "prices" ? "Try plain numbers" : "Try prices"}</button>
        </div>`;
      container.querySelector("#back").onclick = () => navigate("reading");
      container.querySelector("#again").onclick = () => renderNumbersDrill(container, kind);
      container.querySelector("#switch").onclick = () => renderNumbersDrill(container, kind === "prices" ? "numbers" : "prices");
      return;
    }
    container.innerHTML = `
      <button class="back-link" id="back">&larr; Back to reading list</button>
      <div class="row between"><span class="pill">${kind === "prices" ? "Prices" : "Numbers"} — ${round + 1} / ${ROUNDS}</span></div>
      <div class="progressbar" style="margin:10px 0 20px;"><div style="width:${Math.round((round / ROUNDS) * 100)}%"></div></div>
      <div class="card">
        <p class="sub">Listen, then type what you heard ${kind === "prices" ? "(e.g. 3.50)" : "as digits"}.</p>
        <div class="row" style="margin-bottom:14px;">
          <button class="speak-btn" id="play" title="Play">🔊</button>
          <span class="sub">Tap to hear it again</span>
        </div>
        <div class="text-fallback">
          <input type="text" id="guess" inputmode="decimal" autocomplete="off" placeholder="${kind === "prices" ? "e.g. 3.50" : "e.g. 47"}" />
          <button class="btn" id="check">Check</button>
        </div>
        <p id="feedback" style="margin-top:14px;">${feedback}</p>
      </div>`;
    container.querySelector("#back").onclick = () => navigate("reading");
    container.querySelector("#play").onclick = () => speakGerman(spoken, { rate: 0.8 });
    const input = container.querySelector("#guess");
    input.focus();
    const check = () => {
      const guess = parseGuess(input.value);
      if (guess === null) return;
      const ok = Math.abs(guess - answer) < 0.001;
      if (ok) correctCount++;
      const shown = kind === "prices" ? answer.toFixed(2) + " €" : answer;
      container.querySelector("#feedback").innerHTML = `${ok ? "✅ Richtig!" : "❌ Not quite."} It was <strong>${escapeHtml(spoken)}</strong> = ${shown}. <button class="btn" id="next" style="margin-left:8px;">Next</button>`;
      container.querySelector("#check").disabled = true;
      input.disabled = true;
      container.querySelector("#next").onclick = () => {
        round++;
        newQuestion();
        draw();
        if (round < ROUNDS) speakGerman(spoken, { rate: 0.8 });
      };
      container.querySelector("#next").focus();
    };
    container.querySelector("#check").onclick = check;
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") check();
    });
  }

  newQuestion();
  draw();
  speakGerman(spoken, { rate: 0.8 });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
