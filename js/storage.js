const KEY = "deutschUeben_v1";

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState();
    return { ...defaultState(), ...JSON.parse(raw) };
  } catch {
    return defaultState();
  }
}

function defaultState() {
  return {
    level: null, // 'beginner' | 'false-beginner' | 'a1' | 'a2'
    lastAssessment: null, // { date, score, total, weakCategories: [] }
    leitner: {}, // vocabId -> { box: 0-3, lastSeen: iso }
    dialogueProgress: {}, // dialogueId -> { completed: bool, lastNode: id }
    lessons: {}, // lessonId -> { stars, bestAccuracy, completions, last }
    xp: 0,
    vocab: {}, // german text -> { correct, wrong, last } from lesson exercises
    streak: { count: 0, last: null }, // last = local date (YYYY-MM-DD) of last completed lesson
  };
}

let state = load();

function save() {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function getState() {
  return state;
}

export function setLevel(level) {
  state.level = level;
  save();
}

export function setAssessmentResult(result) {
  state.lastAssessment = result;
  state.level = result.level;
  save();
}

export function getLeitnerBox(vocabId) {
  return state.leitner[vocabId]?.box ?? 0;
}

export function markVocab(vocabId, known) {
  const cur = state.leitner[vocabId]?.box ?? 0;
  const box = known ? Math.min(3, cur + 1) : 0;
  state.leitner[vocabId] = { box, lastSeen: new Date().toISOString() };
  save();
}

export function getDialogueProgress(dialogueId) {
  return state.dialogueProgress[dialogueId] || { completed: false, lastNode: null };
}

export function setDialogueProgress(dialogueId, progress) {
  state.dialogueProgress[dialogueId] = progress;
  save();
}

export function resetAll() {
  state = defaultState();
  save();
}

// --- Lessons: progress, XP, daily streak ---

const dayString = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function getLessonProgress(lessonId) {
  return state.lessons[lessonId] || null;
}

export function getXP() {
  return state.xp || 0;
}

// The streak only counts while it's still alive (studied today or yesterday).
export function getStreak() {
  const { count, last } = state.streak || { count: 0, last: null };
  if (!last) return 0;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return last === dayString() || last === dayString(yesterday) ? count : 0;
}

export function completeLesson(lessonId, { stars, accuracy, xp }) {
  const prev = state.lessons[lessonId];
  state.lessons[lessonId] = {
    stars: Math.max(stars, prev?.stars || 0),
    bestAccuracy: Math.max(accuracy, prev?.bestAccuracy || 0),
    completions: (prev?.completions || 0) + 1,
    last: new Date().toISOString(),
  };
  state.xp = (state.xp || 0) + xp;

  const today = dayString();
  if (state.streak.last !== today) {
    state.streak = { count: getStreak() + 1, last: today };
  }
  save();
  return { streak: state.streak.count, totalXP: state.xp };
}

// --- Per-word practice stats (drives what the AI tutor reuses and reviews) ---

export function recordVocab(words, correct) {
  if (!words?.length) return;
  const now = new Date().toISOString();
  for (const w of words) {
    const cur = state.vocab[w] || { correct: 0, wrong: 0, last: null };
    if (correct) cur.correct++;
    else cur.wrong++;
    cur.last = now;
    state.vocab[w] = cur;
  }
  save();
}

export function getVocabStats() {
  return state.vocab || {};
}
