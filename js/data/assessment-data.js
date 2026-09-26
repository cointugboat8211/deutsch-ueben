import { matchesTyped } from "../speech.js";
import { numberToGerman, priceToGerman } from "../numbers.js";

// ---------------------------------------------------------------------------
// Adaptive placement test.
//
// Every question has a difficulty 1–6. The test starts at level 2: a correct
// answer moves the next question one level up, a wrong answer (or "I don't
// know") one level down. Guessers drift to the bottom, and real ability makes
// the test hover around the level where you start to struggle, so the average
// difficulty over the final questions is the estimate of "where you are".
// ---------------------------------------------------------------------------

export const MIN_D = 1;
export const MAX_D = 6;
const START_D = 2;
export const TOTAL_QUESTIONS = 24;

export const DIFFICULTY_LABELS = {
  1: "Very first words",
  2: "Basic words & pronouns",
  3: "Simple phrases & articles",
  4: "Café, prices & sentences",
  5: "Everyday grammar",
  6: "Past tense & connectors",
};

const mc = (id, d, category, prompt, correct, wrong) => ({ id, d, category, type: "mc", prompt, correct, wrong });
const listen = (id, d, category, prompt, correct, wrong) => ({ id, d, category, type: "listen", prompt, correct, wrong });
const typed = (id, d, prompt, accept) => ({ id, d, category: "typed", type: "typed", prompt: `Type in German: ${prompt}`, accept });

const ART = ["der", "die", "das"];
const article = (noun, art, en) =>
  mc(`art-${noun}`, 3, "articles", `Which article goes with '${noun}' (${en})?`, `${art} ${noun}`,
    [...ART.filter((a) => a !== art).map((a) => `${a} ${noun}`), `den ${noun}`]);

const BANK = [
  // ---- Level 1: very first words ----
  mc("gr1", 1, "greetings", "How do you say 'Hello' (casual, all-purpose) in German?", "Hallo", ["Tschüss", "Bitte", "Danke"]),
  mc("gr2", 1, "greetings", "What does 'Wie geht's?' mean?", "How are you?", ["What's your name?", "Where are you?", "Goodbye"]),
  mc("gr3", 1, "greetings", "What does 'Guten Morgen' mean?", "Good morning", ["Good night", "Good evening", "Goodbye"]),
  mc("vc1", 1, "vocab", "What does 'die Katze' mean?", "cat", ["dog", "bird", "fish"]),
  mc("vc2", 1, "vocab", "What does 'das Brot' mean?", "bread", ["butter", "cheese", "egg"]),
  listen("vc3", 1, "vocab", "das Wasser", "water", ["bread", "milk", "wine"]),
  mc("vc6", 1, "vocab", "What does 'die Milch' mean?", "milk", ["water", "juice", "cheese"]),
  mc("vc10", 1, "vocab", "What does 'der Hund' mean?", "dog", ["cat", "horse", "mouse"]),
  mc("pr3", 1, "pronouns", "'ich' means:", "I", ["he", "we", "you"]),
  typed("ty1", 1, "'Thank you'", ["danke", "danke schön", "vielen dank"]),
  typed("ty5", 1, "'Good morning'", ["guten morgen"]),

  // ---- Level 2: basic words & pronouns ----
  mc("gr4", 2, "greetings", "What does 'Auf Wiedersehen' mean?", "Goodbye (formal)", ["Hello", "Please", "Sorry"]),
  mc("gr5", 2, "greetings", "'Entschuldigung' means:", "Excuse me / sorry", ["Thank you", "Please", "Goodbye"]),
  mc("gr6", 2, "greetings", "What does 'Wie heißt du?' mean?", "What's your name?", ["How old are you?", "Where do you live?", "How are you?"]),
  mc("gr7", 2, "greetings", "What does 'Gute Nacht' mean?", "Good night", ["Good morning", "Good evening", "Good day"]),
  mc("gr8", 2, "greetings", "What does 'Bitte schön' most likely mean as a reply to 'Danke'?", "You're welcome", ["Excuse me", "Good luck", "See you"]),
  mc("pr1", 2, "pronouns", "Which pronoun means 'you' (informal, singular)?", "du", ["Sie", "wir", "ihr"]),
  mc("pr2", 2, "pronouns", "'wir' means:", "we", ["you", "they", "I"]),
  mc("pr4", 2, "pronouns", "'er' means:", "he", ["she", "it", "we"]),
  mc("pr5", 2, "pronouns", "Which pronoun means 'they'?", "sie", ["wir", "ihr", "du"]),
  mc("vb1", 2, "verbs", "Fill in: 'Ich ___ Anna.' (I am Anna.)", "bin", ["bist", "ist", "sind"]),
  mc("vb5", 2, "verbs", "'Wir gehen' means:", "We go", ["I go", "You go", "They went"]),
  mc("vb6", 2, "verbs", "'Ich habe' means:", "I have", ["I am", "I had", "You have"]),
  listen("vc4", 2, "vocab", "der Bahnhof", "train station", ["airport", "hospital", "bakery"]),
  mc("vc5", 2, "vocab", "What does 'der Apfel' mean?", "apple", ["orange", "pear", "banana"]),
  mc("vc7", 2, "vocab", "What does 'das Haus' mean?", "house", ["car", "garden", "door"]),
  listen("vc8", 2, "vocab", "die Schule", "school", ["street", "shop", "office"]),
  listen("vc9", 2, "vocab", "das Buch", "book", ["table", "bag", "pen"]),
  typed("ty2", 2, "'My name is Anna.'", ["ich heiße anna", "mein name ist anna"]),
  typed("ty11", 2, "'Yes, please.'", ["ja bitte"]),

  // ---- Level 3: simple phrases & articles ----
  article("Tisch", "der", "table"), article("Frau", "die", "woman"), article("Kind", "das", "child"),
  article("Buch", "das", "book"), article("Mann", "der", "man"), article("Katze", "die", "cat"),
  article("Auto", "das", "car"), article("Lampe", "die", "lamp"), article("Hund", "der", "dog"),
  mc("vb2", 3, "verbs", "Fill in: 'Sie ___ einen Hund.' (She has a dog.)", "hat", ["habe", "haben", "hast"]),
  mc("vb3", 3, "verbs", "Fill in: 'Wir ___ müde.' (We are tired.)", "sind", ["bin", "ist", "seid"]),
  mc("vb4", 3, "verbs", "Fill in: 'Du ___ nett.' (You are nice.)", "bist", ["bin", "ist", "sind"]),
  mc("vb7", 3, "verbs", "Fill in: 'Ich ___ einen Kaffee.' (I would like a coffee.)", "möchte", ["möchtest", "möchten", "mögt"]),
  mc("vb8", 3, "verbs", "Fill in: 'Ich ___ Deutsch.' (I am learning German.)", "lerne", ["lernst", "lernt", "lernen"]),
  mc("cf1", 3, "cafe", "What does 'Ich hätte gern einen Kaffee' mean?", "I would like a coffee", ["I make coffee", "I own a coffee shop", "I don't like coffee"]),
  mc("cf2", 3, "cafe", "The waiter says 'Zum Mitnehmen oder hier?' What is he asking?", "To go or eat here?", ["Cash or card?", "Milk or sugar?", "Small or large?"]),
  typed("ty3", 3, "'A coffee with milk, please.'", ["einen kaffee mit milch bitte", "ein kaffee mit milch bitte", "kaffee mit milch bitte"]),
  typed("ty6", 3, "'I would like a tea, please.'", ["ich möchte einen tee bitte", "ich hätte gern einen tee bitte", "einen tee bitte"]),
  typed("ty8", 3, "'I don't understand.'", ["ich verstehe nicht"]),
  typed("ty9", 3, "'I am learning German.'", ["ich lerne deutsch"]),

  // ---- Level 4: café, prices & sentences ----
  mc("wo1", 4, "word-order", "Which sentence is correctly ordered?", "Heute gehe ich einkaufen.",
    ["Heute ich gehe einkaufen.", "Ich heute gehe einkaufen.", "Gehe heute ich einkaufen."]),
  mc("wo2", 4, "word-order", "Which sentence is correctly ordered?", "Ich trinke gern Kaffee.",
    ["Ich gern trinke Kaffee.", "Trinke ich gern Kaffee nicht.", "Gern Kaffee ich trinke."]),
  mc("vb9", 4, "verbs", "Fill in: 'Ihr ___ Hunger.' (You all are hungry — literally 'have hunger'.)", "habt", ["hast", "haben", "hat"]),
  mc("vb10", 4, "verbs", "Fill in: 'Ich ___ gern.' (I like swimming.)", "schwimme", ["schwimmst", "schwimmt", "schwimmen"]),
  mc("cf3", 4, "cafe", "'Stimmt so' (when paying) means:", "Keep the change", ["That's wrong", "I'm ready", "The bill, please"]),
  mc("cf4", 4, "cafe", "What does 'Die Rechnung, bitte' mean?", "The bill, please", ["The menu, please", "Another coffee", "The table is free"]),
  mc("cf5", 4, "cafe", "What does 'Bar oder mit Karte?' mean?", "Cash or card?", ["Bar or restaurant?", "Hot or cold?", "Here or to go?"]),
  mc("cf6", 4, "cafe", "The waiter asks 'Mit Milch und Zucker?' What is he asking?", "With milk and sugar?", ["With ice and lemon?", "Small or large?", "Anything else?"]),
  mc("ph1", 4, "phrases", "What does 'Wie spät ist es?' mean?", "What time is it?", ["How are you doing?", "What day is it?", "Where is it?"]),
  mc("ph2", 4, "phrases", "What does 'Ich möchte bezahlen' mean?", "I would like to pay", ["I would like to stay", "I would like to order", "I would like to leave"]),
  mc("ph3", 4, "phrases", "What does 'Können Sie das bitte wiederholen?' mean?", "Could you please repeat that?", ["Could you please help me?", "Could you please wait?", "Could you please write that?"]),
  typed("ty4", 4, "'How much does that cost?'", ["wie viel kostet das", "wieviel kostet das"]),
  typed("ty7", 4, "'Where is the train station?'", ["wo ist der bahnhof"]),
  typed("ty10", 4, "'The bill, please.'", ["die rechnung bitte"]),
  typed("ty12", 4, "'I live in Berlin.'", ["ich wohne in berlin"]),

  // ---- Level 5: everyday grammar ----
  mc("wo3", 5, "word-order", "Which sentence is correctly ordered?", "Morgen fahren wir nach Berlin.",
    ["Morgen wir fahren nach Berlin.", "Wir morgen nach Berlin fahren.", "Fahren morgen nach Berlin wir."]),
  mc("gm1", 5, "grammar", "Fill in: 'Ich sehe ___ Hund.' (I see the dog.)", "den", ["der", "die", "dem"]),
  mc("gm2", 5, "grammar", "Fill in: 'Ich kann gut Deutsch ___.' (I can speak German well.)", "sprechen", ["spreche", "spricht", "sprichst"]),
  mc("gm3", 5, "grammar", "Which is correct for 'I don't have a car'?", "Ich habe kein Auto.",
    ["Ich habe nicht Auto.", "Ich habe keine Auto.", "Ich nicht habe Auto."]),
  mc("gm4", 5, "grammar", "Fill in: 'Ich fahre ___ dem Bus.' (I go by bus.)", "mit", ["für", "nach", "bei"]),
  mc("gm5", 5, "grammar", "Fill in: 'Ich habe gestern Fußball ___.' (I played soccer yesterday.)", "gespielt", ["spiele", "spielst", "spielen"]),
  mc("ph4", 5, "phrases", "What time is 'Es ist halb drei'?", "2:30", ["3:30", "3:00", "3:15"]),
  mc("ph5", 5, "phrases", "What does 'Ich habe mich verlaufen' mean?", "I got lost", ["I ran away", "I lost something", "I have run out"]),
  typed("ty13", 5, "'I have two brothers.'", ["ich habe zwei brüder"]),
  typed("ty14", 5, "'Can you help me?' (informal)", ["kannst du mir helfen"]),

  // ---- Level 6: past tense & connectors ----
  mc("gm6", 6, "grammar", "Fill in: 'Gestern ___ ich im Kino.' (Yesterday I was at the cinema.)", "war", ["bin", "ist", "wird"]),
  mc("gm7", 6, "grammar", "Fill in: 'Ich freue mich ___ das Wochenende.' (I'm looking forward to the weekend.)", "auf", ["für", "an", "über"]),
  mc("gm8", 6, "grammar", "Which sentence is correct? (Because I'm tired, I'm going to bed.)", "Weil ich müde bin, gehe ich ins Bett.",
    ["Weil ich bin müde, gehe ich ins Bett.", "Weil ich müde bin, ich gehe ins Bett.", "Weil bin ich müde, gehe ich ins Bett."]),
  mc("ph6", 6, "phrases", "What does 'Hätten Sie vielleicht ein Zimmer frei?' mean?", "Would you perhaps have a room available?",
    ["Is this room taken?", "Are you free tomorrow?", "Could you clean the room?"]),
  typed("ty15", 6, "'Yesterday I went to the supermarket.'", [
    "gestern bin ich zum supermarkt gegangen", "gestern bin ich in den supermarkt gegangen",
    "ich bin gestern zum supermarkt gegangen", "ich bin gestern in den supermarkt gegangen",
  ]),
  typed("ty16", 6, "'I would like a table for two.'", ["ich möchte einen tisch für zwei", "ich hätte gern einen tisch für zwei", "ich möchte einen tisch für zwei personen"]),
];

// ---- Helpers ---------------------------------------------------------------

const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
export const shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = rnd(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const swapDigits = (n) => Number(String(n).split("").reverse().join(""));

// First 3 distinct candidates that differ from the correct answer.
const distractors = (correct, candidates) => {
  const seen = new Set([String(correct)]);
  const out = [];
  for (const c of candidates) {
    if (!seen.has(String(c))) {
      seen.add(String(c));
      out.push(c);
    }
    if (out.length === 3) break;
  }
  return out;
};

const numDistractors = (n) =>
  distractors(n, [swapDigits(n), n + 10, n - 10, n + 1, n - 1, n + 20, n - 20, n + 2, n + 3].filter((x) => x > 0));

const price = (e, c) => `€${e}.${String(c).padStart(2, "0")}`;

// A fresh randomized number/price question at difficulty d (never the same twice).
let genCounter = 0;
function numberQuestion(d) {
  const id = `gen${++genCounter}`;
  const tricky = (lo, hi) => {
    let n;
    do n = rnd(lo, hi);
    while (n % 10 === 0 || n % 11 === 0);
    return n;
  };
  const ranges = { 1: [1, 10], 2: [11, 20], 3: [21, 49], 4: [50, 99], 5: [21, 99], 6: [21, 99] };
  const [lo, hi] = ranges[d];
  const kinds = d <= 2 ? ["hear", "word"] : d === 3 ? ["hear", "digitword", "typed"] : ["hear", "digitword", "price", "typed"];
  const kind = kinds[rnd(0, kinds.length - 1)];

  if (kind === "hear") {
    const n = d >= 3 ? tricky(lo, hi) : rnd(lo, hi);
    return listen(id, d, "numbers", numberToGerman(n), String(n), numDistractors(n).map(String));
  }
  if (kind === "word") {
    const n = rnd(lo, hi);
    return mc(id, d, "numbers", `What number is '${numberToGerman(n)}'?`, String(n), numDistractors(n).map(String));
  }
  if (kind === "digitword") {
    const n = tricky(lo, hi);
    return mc(id, d, "numbers", `How do you say ${n} in German?`, numberToGerman(n), numDistractors(n).map(numberToGerman));
  }
  if (kind === "price") {
    const euros = d === 4 ? rnd(2, 9) : d === 5 ? rnd(2, 19) : rnd(10, 89);
    const cents = d === 4 ? 50 : [20, 30, 40, 50, 80, 90][rnd(0, 5)];
    const others = [20, 30, 40, 50, 80, 90].filter((c) => c !== cents);
    return listen(id, d, "numbers", `Das macht ${priceToGerman(euros, cents)}.`, price(euros, cents),
      distractors(price(euros, cents), [
        price(euros + 1, cents), price(euros, others[rnd(0, others.length - 1)]),
        price(euros - 1, cents), price(euros + 10, cents), price(euros, others[rnd(0, others.length - 1)]),
      ]));
  }
  // typed: write a number in German
  const n = tricky(Math.max(lo, 13), hi);
  const q = typed(id, d, "", [numberToGerman(n)]);
  q.prompt = `Type the number in German: ${n}`;
  return q;
}

// ---- Seen-question memory (so repeat takings feel fresh) --------------------

const SEEN_KEY = "deutschUeben_seenQuestions";

function loadSeen() {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

function saveSeen(set) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...set]));
  } catch {}
}

// Turns a raw question into what the UI shows (options shuffled, correct index set).
export function finalizeQuestion(q, number) {
  const base = { id: `q${number}`, d: q.d, category: q.category, type: q.type, prompt: q.prompt, ai: !!q.ai };
  if (q.type === "typed") return { ...base, accept: q.accept };
  const options = shuffle([q.correct, ...q.wrong]);
  return { ...base, options, correct: options.indexOf(q.correct) };
}

// ---- The adaptive engine -----------------------------------------------------

export function createAdaptiveTest({ total = TOTAL_QUESTIONS } = {}) {
  const seenGlobal = loadSeen();
  const askedIds = new Set();
  const history = []; // { q, ok }
  let d = START_D;
  let numbersAsked = 0;
  let lastCategory = null;

  const clamp = (x) => Math.max(MIN_D, Math.min(MAX_D, x));

  function poolAt(level, ignoreSeen) {
    return BANK.filter((q) => q.d === level && !askedIds.has(q.id) && (ignoreSeen || !seenGlobal.has(q.id)));
  }

  function chooseRaw() {
    // Roughly one question in four is a freshly generated number/price question.
    if (numbersAsked < 6 && Math.random() < 0.25) {
      numbersAsked++;
      return numberQuestion(d);
    }
    const order = [d, d - 1, d + 1, d - 2, d + 2, d - 3, d + 3].filter((x) => x >= MIN_D && x <= MAX_D);
    for (const ignoreSeen of [false, true]) {
      for (const level of order) {
        let pool = poolAt(level, ignoreSeen);
        if (!pool.length) continue;
        const varied = pool.filter((q) => q.category !== lastCategory);
        if (varied.length) pool = varied;
        // From level 3 on, lean towards typed questions: they measure real recall.
        const typedPool = pool.filter((q) => q.type === "typed");
        if (level >= 3 && typedPool.length && Math.random() < 0.35) pool = typedPool;
        return pool[rnd(0, pool.length - 1)];
      }
    }
    numbersAsked++;
    return numberQuestion(d);
  }

  function present(raw) {
    askedIds.add(raw.id);
    if (!raw.ai) seenGlobal.add(raw.id);
    lastCategory = raw.category;
    return finalizeQuestion(raw, history.length + 1);
  }

  return {
    get difficulty() {
      return d;
    },
    get asked() {
      return history.length;
    },
    next() {
      return present(chooseRaw());
    },
    // For questions written by the AI model at the current difficulty.
    nextFromRaw(raw) {
      return present({ ...raw, d, ai: true });
    },
    record(q, answer) {
      const ok = q.type === "typed" ? matchesTyped(String(answer ?? ""), q.accept) : answer === q.correct;
      history.push({ q, ok });
      d = clamp(q.d + (ok ? 1 : -1));
      if (history.length >= total) saveSeen(seenGlobal);
      return { ok, done: history.length >= total };
    },
    result() {
      const last = history.slice(-8).map((h) => h.q.d).concat([d]);
      const estimate = last.reduce((a, b) => a + b, 0) / last.length;

      const byLevel = {};
      const missed = {};
      let score = 0;
      let typedCorrect = 0;
      let typedTotal = 0;
      for (const { q, ok } of history) {
        byLevel[q.d] = byLevel[q.d] || { correct: 0, total: 0 };
        byLevel[q.d].total++;
        if (ok) {
          byLevel[q.d].correct++;
          score++;
        } else {
          const cat = q.ai ? "general" : q.category;
          missed[cat] = (missed[cat] || 0) + 1;
        }
        if (q.type === "typed") {
          typedTotal++;
          if (ok) typedCorrect++;
        }
      }

      let level;
      if (estimate < 2.5) level = "beginner";
      else if (estimate < 3.6) level = "false-beginner";
      else if (estimate < 5) level = "a1";
      else level = "a2";

      return {
        date: new Date().toISOString(),
        score,
        total: history.length,
        estimate: Math.round(estimate * 10) / 10,
        byLevel,
        typedCorrect,
        typedTotal,
        level,
        weakCategories: Object.entries(missed).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c]) => c),
      };
    },
  };
}

export const levelLabels = {
  beginner: "Complete Beginner",
  "false-beginner": "False Beginner",
  a1: "A1",
  a2: "A2",
};

export const levelDescriptions = {
  beginner: "You're just starting out — we'll focus on the absolute basics: greetings, numbers, and core words.",
  "false-beginner": "You know a few words already. We'll build up simple everyday phrases and sentences.",
  a1: "You have a foundation. We'll work on full conversations and broader vocabulary.",
  a2: "You can handle basic exchanges already. We'll push into more natural, varied conversation.",
};
