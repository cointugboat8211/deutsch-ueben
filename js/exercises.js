// Turns a lesson's words and sentences into a shuffled sequence of exercises.
// Pure logic (no DOM), so it can be tested on its own.

import { allItems } from "./data/lessons-data.js";
import { numberToGerman, priceToGerman } from "./numbers.js";

const MAX_EXERCISES = 20;

export const shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const rnd = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));

// The answer plus up to 3 distinct wrong options, taken from `pool` values.
function options(correct, pool, key) {
  const wrong = shuffle([...new Set(pool.map((p) => p[key]))].filter((v) => v !== correct)).slice(0, 3);
  const opts = shuffle([correct, ...wrong]);
  return { options: opts, correct: opts.indexOf(correct) };
}

// Words used as distractors: the lesson first, topped up from the whole course.
function poolFor(lesson, key, correct) {
  const local = lesson.items;
  const enough = new Set(local.map((p) => p[key]).filter((v) => v !== correct)).size >= 3;
  return enough ? local : [...local, ...allItems];
}

const stripPunct = (t) => t.replace(/^[¿¡"„]+|[.,!?"“”]+$/g, "");

// German-only picture recognition: no English shown at all, in either direction.
const picPool = (it) => allItems.filter((i) => i.pic && i.pic !== it.pic);

const picGuess = (lesson, it) => ({
  type: "pick",
  prompt: "What does this word mean? (tap the picture)",
  big: it.de,
  speak: it.de,
  words: [it.de],
  isPic: true,
  answerText: `${it.pic} ${it.de}`,
  ...options(it.pic, picPool(it), "pic"),
});

const listenPic = (it) => ({
  type: "listen-pick",
  prompt: "Listen, then tap the matching picture",
  audio: it.de,
  speak: it.de,
  words: [it.de],
  isPic: true,
  answerText: `${it.pic} ${it.de}`,
  ...options(it.pic, picPool(it), "pic"),
});

// German-only comprehension: read/hear a line, pick the German reply that fits.
// Built from a lesson's authored `qa` pairs (question + right answer + 3 wrong).
const qaPick = (qa) => {
  const opts = shuffle([qa.a, ...qa.wrong]);
  return {
    type: "pick",
    prompt: "Which reply fits? (auf Deutsch)",
    big: qa.q,
    speak: qa.q,
    words: [qa.q, qa.a],
    isQA: true,
    answerText: qa.a,
    options: opts,
    correct: opts.indexOf(qa.a),
  };
};

// ---- exercise constructors --------------------------------------------------

const pickDeEn = (lesson, it) => ({
  type: "pick",
  prompt: "What does this mean?",
  big: it.de,
  speak: it.de,
  words: [it.de],
  answerText: it.en,
  ...options(it.en, poolFor(lesson, "en", it.en), "en"),
});

const pickEnDe = (lesson, it) => ({
  type: "pick",
  prompt: "How do you say this in German?",
  big: it.en,
  speak: it.de,
  words: [it.de],
  answerText: it.de,
  ...options(it.de, poolFor(lesson, "de", it.de), "de"),
});

const listenPick = (lesson, it) => ({
  type: "listen-pick",
  prompt: "Listen, then choose the meaning",
  audio: it.de,
  speak: it.de,
  words: [it.de],
  answerText: `${it.de} = ${it.en}`,
  ...options(it.en, poolFor(lesson, "en", it.en), "en"),
});

const listenType = (it) => ({
  type: "listen-type",
  prompt: "Type what you hear",
  audio: it.de,
  speak: it.de,
  accept: [it.de],
  words: [it.de],
  answerText: it.de,
});

const translateType = (it) => ({
  type: "translate-type",
  prompt: "Type this in German",
  big: it.en,
  speak: it.de,
  accept: [it.de],
  words: [it.de],
  answerText: it.de,
});

const match = (items) => ({
  type: "match",
  prompt: "Match the pairs",
  pairs: items.map((i) => ({ de: i.de, en: i.en })),
  words: items.map((i) => i.de),
  speak: null,
  answerText: items.map((i) => `${i.de} = ${i.en}`).join(", "),
});

function tiles(lesson, s, fromAudio) {
  const target = s.de.split(" ").map(stripPunct).filter(Boolean);
  const others = [...new Set((lesson.sentences || []).filter((x) => x !== s).flatMap((x) => x.de.split(" ").map(stripPunct)))]
    .filter((t) => !target.includes(t));
  const extras = shuffle(others).slice(0, 2);
  return {
    type: "tiles",
    prompt: fromAudio ? "Listen, then build the sentence" : "Build this sentence in German",
    big: fromAudio ? null : s.en,
    audio: fromAudio ? s.de : null,
    speak: s.de,
    words: [s.de],
    target,
    tiles: shuffle([...target, ...extras]),
    answerText: s.de,
  };
}

const speak = (s) => ({
  type: "speak",
  prompt: "Say it out loud",
  big: s.de,
  sub: s.en,
  speak: s.de,
  words: [s.de],
  target: s.de,
  answerText: s.de,
});

function digitsExercise(spec, n) {
  if (spec.kind === "price") {
    const euros = rnd(1, 19);
    const cents = [0, 20, 30, 50, 80, 90][rnd(0, 5)];
    return {
      type: "digits",
      prompt: "Listen and type the price in euros (like 3.50)",
      audio: `Das macht ${priceToGerman(euros, cents)}.`,
      written: `${priceToGerman(euros, cents)}`,
      answer: euros + cents / 100,
      answerText: `${euros}.${String(cents).padStart(2, "0")} €`,
      speak: `Das macht ${priceToGerman(euros, cents)}.`,
    };
  }
  let value;
  if (spec.tensOnly) value = rnd(2, 10) * 10;
  else value = rnd(spec.lo, spec.hi);
  return {
    type: "digits",
    prompt: "Listen and type the number (digits)",
    audio: numberToGerman(value),
    written: numberToGerman(value),
    answer: value,
    answerText: `${numberToGerman(value)} = ${value}`,
    speak: numberToGerman(value),
  };
}

// ---- the lesson builder -----------------------------------------------------

export function buildExercises(lesson, { hasVoice = true, canSpeak = true } = {}) {
  const items = lesson.items;
  const sents = lesson.sentences || [];

  // Stage 1: recognition (easy). Items with a picture skip English entirely.
  const stage1 = shuffle(items)
    .slice(0, 6)
    .map((it) => (it.pic && Math.random() < 0.6 ? picGuess(lesson, it) : pickDeEn(lesson, it)));

  // Stage 2: recall in both directions, listening, and matching.
  const stage2 = shuffle(items)
    .slice(0, 6)
    .map((it, i) => {
      if (i % 2 === 0) return pickEnDe(lesson, it);
      if (!hasVoice) return pickEnDe(lesson, it);
      return it.pic && Math.random() < 0.5 ? listenPic(it) : listenPick(lesson, it);
    });
  if (items.length >= 4) stage2.push(match(shuffle(items).slice(0, 5)));

  // Stage 3: production (build / type / say).
  const stage3 = [];
  sents.forEach((s) => stage3.push(tiles(lesson, s, false)));
  if (hasVoice) sents.slice(0, 2).forEach((s) => stage3.push(tiles(lesson, s, true)));
  shuffle(items)
    .slice(0, 3)
    .forEach((it) => stage3.push(hasVoice ? listenType(it) : translateType(it)));
  if (lesson.digits) for (let i = 0; i < lesson.digits.count; i++) stage3.push(digitsExercise(lesson.digits, i));
  // German-only comprehension: does the learner understand without translating?
  (lesson.qa || []).forEach((qa) => stage3.push(qaPick(qa)));
  if (canSpeak) shuffle(sents).slice(0, 2).forEach((s) => stage3.push(speak(s)));

  const all = [...stage1, ...shuffle(stage2), ...shuffle(stage3)];
  if (all.length <= MAX_EXERCISES) return all;

  // Too many: trim evenly but always keep the digit drills and the speaking practice.
  const keep = all.filter((e) => e.type === "digits" || e.type === "speak" || e.isQA);
  const rest = all.filter((e) => e.type !== "digits" && e.type !== "speak" && !e.isQA);
  const room = MAX_EXERCISES - keep.length;
  const step = rest.length / Math.max(room, 1);
  const trimmed = Array.from({ length: Math.max(room, 0) }, (_, i) => rest[Math.floor(i * step)]);
  const trimmedSet = new Set([...trimmed, ...keep]);
  return all.filter((e) => trimmedSet.has(e));
}
