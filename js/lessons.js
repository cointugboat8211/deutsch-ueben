import { lessonUnits, allLessons, getLesson } from "./data/lessons-data.js";
import { getDueReviewItems } from "./vocab.js";
import { buildExercises, shuffle } from "./exercises.js";
import { getState, getLessonProgress, completeLesson, getXP, getStreak, recordVocab } from "./storage.js";
import {
  speakGerman,
  speechRecognitionSupported,
  listenOnce,
  stopListening,
  matchesExpected,
  matchesTyped,
  normalizeGerman,
  germanVoices,
  micErrorMessage,
  usingRemoteMic,
} from "./speech.js";
import { navigate } from "./router.js";

export function render(container, params = {}) {
  if (params.mode === "play") return renderPlayer(container, params.lessonId);
  return renderPath(container);
}

// ---------------------------------------------------------------------------
// Course path
// ---------------------------------------------------------------------------

function recommendedLesson() {
  const level = getState().level;
  const startUnit = level === "a2" ? "u4" : level === "a1" ? "u3" : "u1";
  const from = allLessons.findIndex((l) => l.unitId === startUnit);
  return (
    allLessons.slice(from).find((l) => !getLessonProgress(l.id)) ||
    allLessons.find((l) => !getLessonProgress(l.id)) ||
    null
  );
}

function buildReviewLesson() {
  const items = getDueReviewItems(16);
  return { id: "review", title: "Daily Review", items, sentences: [] };
}

function stars(n) {
  return "★".repeat(n) + "☆".repeat(3 - n);
}

function renderPath(container) {
  const next = recommendedLesson();
  const done = allLessons.filter((l) => getLessonProgress(l.id)).length;
  const due = getDueReviewItems(16);

  container.innerHTML = `
    <div class="row between">
      <div>
        <h1>Lessons</h1>
        <p class="sub">Short lessons: learn new words, then practice them. ${done}/${allLessons.length} completed.</p>
      </div>
      <div class="row" style="gap:16px;">
        <span class="pill" title="Days in a row">🔥 ${getStreak()} day streak</span>
        <span class="pill" title="Experience points">⭐ ${getXP()} XP</span>
      </div>
    </div>
    ${
      due.length
        ? `<button class="big-action" id="review-btn" style="width:100%; margin-bottom:16px; border-color:var(--accent-2);">
             <div class="icon">🔁</div>
             <div class="title">Daily Review — ${due.length} word${due.length === 1 ? "" : "s"} due</div>
             <div class="desc">Words from any lesson you've gotten wrong or haven't seen in a while. This is what keeps them from fading.</div>
           </button>`
        : ""
    }
    <div id="units"></div>`;
  container.querySelector("#review-btn")?.addEventListener("click", () => navigate("lessons", { mode: "play", lessonId: "review" }));

  const unitsEl = container.querySelector("#units");
  lessonUnits.forEach((unit) => {
    const unitDone = unit.lessons.filter((l) => getLessonProgress(l.id)).length;
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="row between" style="margin-bottom:12px;">
        <h2 style="margin:0;">${unit.emoji} ${unit.title} <span class="sub" style="font-weight:400;">— ${unit.titleEn}</span></h2>
        <span class="sub">${unitDone}/${unit.lessons.length}</span>
      </div>
      <div class="lesson-list"></div>`;
    const list = card.querySelector(".lesson-list");
    unit.lessons.forEach((lesson) => {
      const prog = getLessonProgress(lesson.id);
      const isNext = next && next.id === lesson.id;
      const btn = document.createElement("button");
      btn.className = "lesson-node" + (prog ? " done" : "") + (isNext ? " next" : "");
      btn.innerHTML = `
        <span class="lesson-title">${lesson.title}</span>
        <span class="lesson-meta">${prog ? `<span class="stars">${stars(prog.stars)}</span>` : isNext ? `<span class="badge">Start here</span>` : `<span class="sub">New</span>`}</span>`;
      btn.onclick = () => navigate("lessons", { mode: "play", lessonId: lesson.id });
      list.appendChild(btn);
    });
    unitsEl.appendChild(card);
  });
}

// ---------------------------------------------------------------------------
// Lesson player
// ---------------------------------------------------------------------------

function renderPlayer(container, lessonId) {
  const lesson = lessonId === "review" ? buildReviewLesson() : getLesson(lessonId);
  if (!lesson) return navigate("lessons");

  const hasVoice = germanVoices().length > 0;
  const canSpeak = speechRecognitionSupported();
  const exercises = buildExercises(lesson, { hasVoice, canSpeak });
  const queue = exercises.slice();
  let pos = 0;
  let firstTry = 0;
  let attempted = 0;

  const say = (text) => text && hasVoice && speakGerman(text);
  const esc = (s) => {
    const d = document.createElement("div");
    d.textContent = s ?? "";
    return d.innerHTML;
  };

  // ---- teach screen ----
  function showTeach() {
    // When a mic is available, require saying each new word correctly before
    // "Start practice" unlocks — an explicit warm-up, not just passive reading.
    const gated = canSpeak;
    const done = lesson.items.map(() => false);

    const wordRow = (it, idx) => `
      <div data-row-idx="${idx}" style="margin-bottom:8px;">
        <div class="word-row" data-idx="${idx}">
          <button class="speak-btn" data-say="${esc(it.de)}" title="Listen">🔊</button>
          <span class="de">${esc(it.de)}</span>
          <span class="en revealed" style="margin-left:auto; text-align:right;">${esc(it.en)}${it.note ? `<br><span class="sub" style="font-size:.75rem;">${esc(it.note)}</span>` : ""}</span>
          ${
            gated
              ? `<button class="speak-btn" data-mic-idx="${idx}" title="Say it">🎤</button><span class="gate-status" data-status-idx="${idx}" title="Not said yet">·</span>`
              : ""
          }
        </div>
        ${gated ? `<p class="sub" data-heard-idx="${idx}" style="margin:4px 0 0 52px; font-size:.82rem;"></p>` : ""}
      </div>`;

    const sentenceRow = (it) => `
      <div class="word-row" style="margin-bottom:8px;">
        <button class="speak-btn" data-say="${esc(it.de)}" title="Listen">🔊</button>
        <span class="de">${esc(it.de)}</span>
        <span class="en revealed" style="margin-left:auto; text-align:right;">${esc(it.en)}</span>
      </div>`;

    container.innerHTML = `
      <button class="back-link" id="exit">&larr; Back to lessons</button>
      <h1>${esc(lesson.title)}</h1>
      <p class="sub">${gated ? "Read and listen first, then say each new word correctly to unlock the lesson." : "Read and listen first, then practice."} Tap 🔊 to hear each one.</p>
      <div class="card">
        <h2>New words${gated ? ` <span class="sub" id="gate-progress" style="font-weight:400;">— 0 / ${lesson.items.length} said</span>` : ""}</h2>
        ${lesson.items.map(wordRow).join("")}
        ${(lesson.sentences || []).length ? `<h2 style="margin-top:18px;">Phrases</h2>${lesson.sentences.map(sentenceRow).join("")}` : ""}
      </div>
      ${hasVoice ? "" : `<p class="sub">No German voice found, so listening exercises are skipped. See the warning at the top for how to add one.</p>`}
      <div class="row">
        <button class="btn" id="start" ${gated ? "disabled" : ""}>Start practice</button>
        ${gated ? `<button class="btn ghost" id="skip-gate">Mic not cooperating? Skip the warm-up</button>` : ""}
      </div>`;
    container.querySelector("#exit").onclick = () => navigate("lessons");
    container.querySelectorAll("[data-say]").forEach((b) => (b.onclick = () => say(b.dataset.say)));
    container.querySelector("#start").onclick = () => showExercise();
    container.querySelector("#skip-gate")?.addEventListener("click", (e) => {
      container.querySelector("#start").disabled = false;
      e.target.remove();
    });

    if (!gated) return;

    function markDone(idx) {
      done[idx] = true;
      const statusEl = container.querySelector(`[data-status-idx="${idx}"]`);
      if (statusEl) {
        statusEl.textContent = "✅";
        statusEl.title = "Said correctly";
      }
      container.querySelector(`[data-idx="${idx}"]`)?.classList.add("done-row");
      container.querySelector(`[data-mic-idx="${idx}"]`)?.setAttribute("disabled", "true");
      const count = done.filter(Boolean).length;
      const progress = container.querySelector("#gate-progress");
      if (progress) progress.textContent = `— ${count} / ${lesson.items.length} said`;
      if (count === lesson.items.length) container.querySelector("#start").disabled = false;
    }

    container.querySelectorAll("[data-mic-idx]").forEach((btn) => {
      const idx = Number(btn.dataset.micIdx);
      const it = lesson.items[idx];
      const statusEl = container.querySelector(`[data-status-idx="${idx}"]`);
      const heardEl = container.querySelector(`[data-heard-idx="${idx}"]`);
      let recording = false;
      btn.onclick = async () => {
        // Tap-to-stop: a fixed recording length either cuts off longer words
        // mid-way or wastes seconds waiting after a short one, and the remote
        // (Whisper) path has no live silence detection to save it from that.
        if (recording) {
          stopListening();
          return;
        }
        recording = true;
        btn.classList.add("listening");
        btn.title = "Tap to stop";
        statusEl.textContent = "…";
        statusEl.title = "Listening";
        heardEl.textContent = usingRemoteMic() ? "Recording… say the word, then tap the mic again to stop." : "Listening…";
        const { transcript, alternatives, error } = await listenOnce();
        recording = false;
        btn.classList.remove("listening");
        btn.title = "Say it";
        if (!transcript) {
          statusEl.textContent = "❌";
          statusEl.title = "Didn't catch anything";
          heardEl.textContent = micErrorMessage(error);
          return;
        }
        // Speech recognition returns up to 3 guesses ranked by confidence; the
        // top one isn't always the accurate one, so check all of them rather
        // than rejecting a correct answer just because it ranked 2nd or 3rd.
        const candidates = alternatives?.length ? alternatives : [transcript];
        const matchedOn = candidates.find((c) => matchesExpected(c, [it.de]));
        if (matchedOn) {
          markDone(idx);
          heardEl.textContent = `Heard: “${matchedOn}” ✓`;
        } else {
          statusEl.textContent = "❌";
          statusEl.title = "Not quite — try again";
          heardEl.textContent = `Heard: “${transcript}” — not quite. Try again, a bit slower or closer to the mic.`;
        }
      };
    });
  }

  // ---- shared frame ----
  function frame(ex, bodyHtml) {
    const pct = Math.round((pos / queue.length) * 100);
    container.innerHTML = `
      <div class="lesson-top">
        <button class="back-link" id="exit" title="Leave lesson" style="margin:0;">✕</button>
        <div class="progressbar" style="flex:1;"><div style="width:${pct}%"></div></div>
      </div>
      <div class="card lesson-card">
        <p class="sub" style="margin-top:0;">${esc(ex.prompt)}${ex.retry ? " · <em>second try</em>" : ""}</p>
        ${bodyHtml}
        <div id="actions" class="row" style="margin-top:18px;"></div>
      </div>
      <div id="feedback"></div>`;
    container.querySelector("#exit").onclick = () => {
      if (pos === 0 || confirm("Leave this lesson? Your progress in it will be lost.")) {
        stopListening();
        navigate("lessons");
      }
    };
  }

  function actions(html) {
    container.querySelector("#actions").innerHTML = html;
  }

  const bigWithSpeaker = (ex) =>
    `<div class="row" style="gap:12px; margin:10px 0 16px;"><h2 style="margin:0; font-size:1.5rem;">${esc(ex.big)}</h2>${hasVoice && ex.speak ? `<button class="speak-btn" id="hear" title="Listen">🔊</button>` : ""}</div>`;

  const audioBlock = (ex) =>
    `<div class="row" style="margin:10px 0 16px;"><button class="speak-btn" id="hear" style="width:64px;height:64px;font-size:1.6rem;" title="Play">🔊</button><span class="sub">Tap to hear it again</span></div>`;

  // ---- feedback + advancing ----
  function finish(ex, correct, skipped = false) {
    if (!skipped) recordVocab(ex.words, correct);
    if (!ex.retry && !skipped) {
      attempted++;
      if (correct) firstTry++;
    }
    if (!correct && !skipped && !ex.retry) queue.push({ ...ex, retry: true });

    const fb = container.querySelector("#feedback");
    fb.innerHTML = `
      <div class="feedback ${skipped ? "" : correct ? "good" : "bad"}">
        <div>
          <strong>${skipped ? "Skipped" : correct ? "✅ Richtig!" : "❌ Not quite"}</strong>
          ${correct && !skipped ? "" : `<div class="sub" style="color:inherit;">Answer: <strong>${esc(ex.answerText)}</strong></div>`}
          ${skipped || !ex.speak || !hasVoice ? "" : `<button class="btn ghost" id="fb-hear" style="padding:0;">🔊 Hear it</button>`}
        </div>
        <button class="btn" id="next">Continue</button>
      </div>`;
    container.querySelector("#actions").innerHTML = "";
    fb.querySelector("#fb-hear")?.addEventListener("click", () => say(ex.speak));
    if (correct && !skipped) say(ex.speak);
    const next = fb.querySelector("#next");
    next.onclick = () => {
      pos++;
      showExercise();
    };
    next.focus();
  }

  // ---- exercise dispatcher ----
  function showExercise() {
    if (pos >= queue.length) return showDone();
    const ex = queue[pos];
    ({
      pick: renderPick,
      "listen-pick": renderPick,
      tiles: renderTiles,
      match: renderMatch,
      "listen-type": renderType,
      "translate-type": renderType,
      digits: renderType,
      speak: renderSpeak,
    })[ex.type](ex);
  }

  // ---- multiple choice (read or listen) ----
  function renderPick(ex) {
    const listening = ex.type === "listen-pick";
    frame(ex, `${listening ? audioBlock(ex) : bigWithSpeaker(ex)}<div id="options"></div>`);
    const hear = container.querySelector("#hear");
    if (hear) hear.onclick = () => say(ex.audio || ex.speak);
    if (listening || ex.isQA || (ex.type === "pick" && /mean/.test(ex.prompt))) say(ex.audio || ex.speak);

    let selected = -1;
    const optsEl = container.querySelector("#options");
    ex.options.forEach((o, i) => {
      const b = document.createElement("button");
      b.className = "q-option" + (ex.isPic ? " emoji-option" : "");
      b.textContent = o;
      b.onclick = () => {
        selected = i;
        [...optsEl.children].forEach((c, j) => c.classList.toggle("selected", j === i));
        actions(`<button class="btn" id="check">Check</button>`);
        container.querySelector("#check").onclick = check;
      };
      optsEl.appendChild(b);
    });
    function check() {
      [...optsEl.children].forEach((c, j) => {
        c.disabled = true;
        c.classList.remove("selected");
        if (j === ex.correct) c.classList.add("correct");
        else if (j === selected) c.classList.add("incorrect");
      });
      finish(ex, selected === ex.correct);
    }
  }

  // ---- build the sentence from word tiles ----
  function renderTiles(ex) {
    const body = `${ex.audio ? audioBlock(ex) : `<h2 style="margin:10px 0 16px; font-size:1.4rem;">${esc(ex.big)}</h2>`}
      <div id="answer" class="tile-line"></div><div id="bank" class="tile-bank"></div>`;
    frame(ex, body);
    const hear = container.querySelector("#hear");
    if (hear) {
      hear.onclick = () => say(ex.audio);
      say(ex.audio);
    }

    const chosen = []; // indexes into ex.tiles
    const answerEl = container.querySelector("#answer");
    const bankEl = container.querySelector("#bank");
    let locked = false;

    function draw() {
      answerEl.innerHTML = "";
      bankEl.innerHTML = "";
      chosen.forEach((idx) => {
        const t = document.createElement("button");
        t.className = "tile";
        t.textContent = ex.tiles[idx];
        t.onclick = () => !locked && (chosen.splice(chosen.indexOf(idx), 1), draw());
        answerEl.appendChild(t);
      });
      ex.tiles.forEach((word, idx) => {
        if (chosen.includes(idx)) return;
        const t = document.createElement("button");
        t.className = "tile";
        t.textContent = word;
        t.onclick = () => !locked && (chosen.push(idx), draw());
        bankEl.appendChild(t);
      });
      actions(chosen.length && !locked ? `<button class="btn" id="check">Check</button>` : "");
      const c = container.querySelector("#check");
      if (c)
        c.onclick = () => {
          locked = true;
          const built = normalizeGerman(chosen.map((i) => ex.tiles[i]).join(" "));
          const ok = built === normalizeGerman(ex.target.join(" "));
          answerEl.classList.add(ok ? "ok" : "bad");
          draw();
          finish(ex, ok);
        };
    }
    draw();
  }

  // ---- match pairs ----
  function renderMatch(ex) {
    frame(ex, `<div class="match-grid"><div id="left"></div><div id="right"></div></div>`);
    const left = shuffle(ex.pairs);
    const right = shuffle(ex.pairs);
    let sel = null;
    let matched = 0;
    let mistakes = 0;
    const leftEl = container.querySelector("#left");
    const rightEl = container.querySelector("#right");
    const mk = (parent, text, side, pair) => {
      const b = document.createElement("button");
      b.className = "q-option";
      b.textContent = text;
      b.dataset.side = side;
      b.onclick = () => {
        if (side === "de") {
          say(pair.de);
          sel = { pair, el: b };
          leftEl.querySelectorAll("button:not(.correct)").forEach((x) => x.classList.remove("selected"));
          b.classList.add("selected");
          return;
        }
        if (!sel) return;
        if (sel.pair === pair) {
          sel.el.classList.remove("selected");
          [sel.el, b].forEach((x) => {
            x.classList.add("correct");
            x.disabled = true;
          });
          sel = null;
          if (++matched === ex.pairs.length) finish(ex, mistakes <= 2);
        } else {
          mistakes++;
          b.classList.add("incorrect");
          setTimeout(() => b.classList.remove("incorrect"), 400);
        }
      };
      parent.appendChild(b);
    };
    left.forEach((p) => mk(leftEl, p.de, "de", p));
    right.forEach((p) => mk(rightEl, p.en, "en", p));
  }

  // ---- typed answers (dictation, translation, digits) ----
  function renderType(ex) {
    const digits = ex.type === "digits";
    const listening = ex.type === "listen-type" || digits;
    let head;
    if (listening && hasVoice) head = audioBlock(ex);
    else if (digits) head = `<h2 style="margin:10px 0 16px;">${esc(ex.written)}</h2>`;
    else head = `<h2 style="margin:10px 0 16px; font-size:1.4rem;">${esc(ex.big)}</h2>`;

    frame(ex, `${head}<div class="text-fallback"><input type="text" id="answer" autocomplete="off" autocapitalize="off" placeholder="${digits ? "e.g. 47 or 3.50" : "Type in German…"}" ${digits ? 'inputmode="decimal"' : ""} /></div>`);
    const hear = container.querySelector("#hear");
    if (hear) {
      hear.onclick = () => say(ex.audio);
      say(ex.audio);
    }
    const input = container.querySelector("#answer");
    input.focus();
    actions(`<button class="btn" id="check">Check</button><button class="btn ghost" id="idk">I don't know</button>`);
    const grade = (value) => {
      input.disabled = true;
      let ok;
      if (digits) {
        const n = parseFloat(String(value).replace(",", ".").replace(/[^0-9.]/g, ""));
        ok = !isNaN(n) && Math.abs(n - ex.answer) < 0.001;
      } else {
        ok = matchesTyped(value, ex.accept);
      }
      finish(ex, ok);
    };
    container.querySelector("#check").onclick = () => input.value.trim() && grade(input.value);
    container.querySelector("#idk").onclick = () => grade("");
    input.addEventListener("keydown", (e) => e.key === "Enter" && input.value.trim() && grade(input.value));
  }

  // ---- speaking ----
  function renderSpeak(ex) {
    frame(ex, `${bigWithSpeaker(ex)}<p class="sub">${esc(ex.sub || "")}</p>
      <div class="row" style="justify-content:center;"><button class="mic-btn" id="mic" ${speechRecognitionSupported() ? "" : "disabled"}>🎤</button></div>
      <p class="sub" id="heard" style="text-align:center;">${speechRecognitionSupported() ? "Tap the mic and say it in German" : "Speech recognition isn't reliable in Safari — type it instead, or use Chrome/Edge on a computer"}</p>
      <div class="text-fallback" style="margin-top:14px;">
        <input type="text" id="typed-speak" placeholder="Or type it here instead…" autocomplete="off" />
        <button class="btn secondary" id="submit-speak">Check</button>
      </div>`);
    container.querySelector("#hear")?.addEventListener("click", () => say(ex.speak));
    actions(`<button class="btn ghost" id="skip">Can't speak right now</button>`);
    container.querySelector("#skip").onclick = () => finish(ex, true, true);
    const mic = container.querySelector("#mic");
    const heardEl = container.querySelector("#heard");

    // `candidates` may hold several speech-recognition guesses ranked by
    // confidence — the top one isn't always the accurate one, so any match
    // counts, not just the first.
    const evaluate = (candidates) => {
      const ok = candidates.some((c) => matchesExpected(c, [ex.target]));
      if (ok) finish(ex, true);
      else heardEl.textContent += " — not quite, try again or skip.";
    };

    container.querySelector("#submit-speak").onclick = () => {
      const val = container.querySelector("#typed-speak").value.trim();
      if (!val) return;
      heardEl.textContent = `You typed: “${val}”`;
      evaluate([val]);
    };
    container.querySelector("#typed-speak").addEventListener("keydown", (e) => {
      if (e.key === "Enter") container.querySelector("#submit-speak").click();
    });

    if (!mic) return;
    let recording = false;
    mic.onclick = async () => {
      if (recording) {
        stopListening();
        return;
      }
      recording = true;
      mic.classList.add("listening");
      heardEl.textContent = usingRemoteMic() ? "Recording… say it, then tap the mic again to stop." : "Listening…";
      const { transcript, alternatives, error } = await listenOnce();
      recording = false;
      mic.classList.remove("listening");
      if (!transcript) {
        heardEl.textContent = micErrorMessage(error);
        return;
      }
      heardEl.textContent = `You said: “${transcript}”`;
      evaluate(alternatives?.length ? alternatives : [transcript]);
    };
  }

  // ---- finish screen ----
  function showDone() {
    const accuracy = attempted ? firstTry / attempted : 1;
    const starCount = accuracy >= 0.9 ? 3 : accuracy >= 0.7 ? 2 : 1;
    const xp = 10 + firstTry * 2 + (accuracy === 1 ? 5 : 0);
    // "review" isn't a real course lesson, so this call is harmless to the lesson list
    // (allLessons never contains it) but still awards XP and keeps the streak alive.
    const { streak } = completeLesson(lesson.id, { stars: starCount, accuracy, xp });
    const next = recommendedLesson();

    container.innerHTML = `
      <div style="text-align:center; padding-top:20px;">
        <div style="font-size:3rem;">🎉</div>
        <h1>Lesson complete!</h1>
        <p class="stars" style="font-size:2rem; margin:6px 0;">${stars(starCount)}</p>
        <p class="sub">${firstTry} of ${attempted} right on the first try (${Math.round(accuracy * 100)}%)</p>
        <div class="row" style="justify-content:center; gap:16px; margin:14px 0 22px;">
          <span class="pill">⭐ +${xp} XP</span>
          <span class="pill">🔥 ${streak} day streak</span>
        </div>
        <div class="row" style="justify-content:center;">
          ${next ? `<button class="btn" id="go-next">Next: ${esc(next.title)}</button>` : ""}
          <button class="btn secondary" id="chat">💬 Practice with the AI tutor</button>
          <button class="btn secondary" id="again">Practice again</button>
          <button class="btn secondary" id="back">All lessons</button>
        </div>
      </div>`;
    container.querySelector("#go-next")?.addEventListener("click", () => navigate("lessons", { mode: "play", lessonId: next.id }));
    container.querySelector("#chat").onclick = () => navigate("aichat", { topic: "lessons" });
    container.querySelector("#again").onclick = () => navigate("lessons", { mode: "play", lessonId: lesson.id });
    container.querySelector("#back").onclick = () => navigate("lessons");
  }

  showTeach();
}
