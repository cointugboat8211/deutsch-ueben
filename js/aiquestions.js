// Optional: let the local AI model (Ollama) write placement questions at the
// difficulty the adaptive test is currently probing.

import { OLLAMA, listModels, pickModel } from "./aichat.js";
import { DIFFICULTY_LABELS } from "./data/assessment-data.js";

const TOPICS = [
  "food and drink", "family", "the home", "animals", "daily routine", "shopping", "travel and transport",
  "weather", "clothes", "hobbies", "the city", "time and dates", "feelings", "work and school", "the body",
];

const DIFFICULTY_GUIDE = {
  1: "single very common words or greetings (like Hallo, Danke, Wasser)",
  2: "basic everyday nouns, pronouns, and the verbs sein/haben in simple sentences",
  3: "simple present-tense phrases, der/die/das articles, and polite requests",
  4: "short everyday sentences: ordering, prices, time, and basic word order",
  5: "everyday grammar: accusative case, modal verbs, negation, common prepositions",
  6: "early A2: perfect tense, past of sein, and subordinate clauses with weil/dass",
};

// Returns a model name if Ollama is running with at least one model, else null.
export async function findModel() {
  try {
    const installed = await listModels();
    return installed.length ? pickModel(installed) : null;
  } catch {
    return null;
  }
}

/**
 * Asks the model for one multiple-choice question. Resolves to a raw question
 * ({ category, type, prompt, correct, wrong }) or null if anything looks off,
 * in which case the caller falls back to the built-in bank.
 */
export async function generateQuestion(model, difficulty, recentPrompts = []) {
  const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
  const system = `You write placement-test questions for English speakers learning German.
Write ONE multiple-choice question at difficulty ${difficulty} of 6 (${DIFFICULTY_LABELS[difficulty]}): ${DIFFICULTY_GUIDE[difficulty]}.
Topic hint: ${topic}.
Rules:
- All German must be 100% correct, natural, and unambiguous. Exactly ONE option is correct.
- The three wrong options must be plausible but clearly wrong (never also correct).
- Write the question instruction in English. Keep it under 160 characters.
- Do not repeat any of these earlier questions: ${JSON.stringify(recentPrompts.slice(-6))}
Reply with ONLY JSON: {"prompt": "...", "correct": "...", "wrong": ["...", "...", "..."]}`;

  try {
    const res = await fetch(`${OLLAMA}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(20000),
      body: JSON.stringify({
        model,
        stream: false,
        format: "json",
        options: { temperature: 0.7 },
        messages: [{ role: "system", content: system }, { role: "user", content: "Write the question." }],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const obj = JSON.parse(data.message?.content || "");
    return validate(obj);
  } catch {
    return null;
  }
}

function validate(obj) {
  const prompt = String(obj?.prompt ?? "").trim();
  const correct = String(obj?.correct ?? "").trim();
  const wrong = Array.isArray(obj?.wrong) ? obj.wrong.map((w) => String(w).trim()) : [];
  if (!prompt || prompt.length > 220 || !correct || wrong.length !== 3) return null;
  const all = [correct, ...wrong].map((s) => s.toLowerCase());
  if (all.some((s) => !s) || new Set(all).size !== 4) return null;
  return { category: "ai", type: "mc", prompt, correct, wrong };
}
