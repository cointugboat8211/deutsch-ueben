// Works out what the learner knows, so the AI tutor can talk in *their* German.
//
//  known   – every word/phrase from completed lessons, plus partly-practiced ones
//            and words marked as known in the Reading section
//  fresh   – words from the two most recently completed lessons (reinforce them)
//  review  – words the learner keeps getting wrong (bring them back)

import { allLessons } from "./data/lessons-data.js";
import { readingTiers } from "./data/content-data.js";
import { getLessonProgress, getVocabStats, getLeitnerBox } from "./storage.js";

const MAX_KNOWN = 160;
const MAX_REVIEW = 8;

export function learnerVocabulary() {
  const stats = getVocabStats();
  const known = new Map(); // de -> {de, en}
  const add = (it) => known.has(it.de) || known.set(it.de, { de: it.de, en: it.en });

  const completed = allLessons
    .filter((l) => getLessonProgress(l.id))
    .sort((a, b) => new Date(getLessonProgress(a.id).last) - new Date(getLessonProgress(b.id).last));

  completed.forEach((l) => l.items.forEach(add));

  // Items from lessons not finished yet, but answered correctly at least twice.
  allLessons.forEach((l) => l.items.forEach((it) => (stats[it.de]?.correct ?? 0) >= 2 && add(it)));

  // Words marked as known in the Reading section.
  readingTiers.forEach((t) =>
    t.categories.forEach((c) => c.items.forEach((it) => getLeitnerBox(it.id) >= 1 && add(it)))
  );

  const fresh = completed.slice(-2).flatMap((l) => l.items);

  const review = [...known.values()]
    .map((w) => ({ ...w, score: (stats[w.de]?.wrong ?? 0) - (stats[w.de]?.correct ?? 0) * 0.5 }))
    .filter((w) => (stats[w.de]?.wrong ?? 0) > 0 && w.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_REVIEW);

  return {
    known: [...known.values()].slice(-MAX_KNOWN), // most recent ones win if the list is long
    total: known.size,
    fresh,
    review,
    recentTopics: completed.slice(-3).map((l) => l.title),
  };
}

// Words worth reviewing today, across the whole course (not just completed
// lessons): anything ever practiced, ranked by how shaky it looks — more
// wrong answers and longer since last seen score higher. Never-practiced
// words aren't included; buildReviewLesson only has something to show once
// at least a few lessons have been started.
export function getDueReviewItems(count = 16) {
  const stats = getVocabStats();
  const now = Date.now();
  const DAY = 86400000;

  const scored = allLessons
    .flatMap((l) => l.items)
    .filter((it, i, arr) => arr.findIndex((x) => x.de === it.de) === i) // de-dupe (a few words repeat across lessons)
    .map((it) => {
      const s = stats[it.de];
      if (!s) return null;
      const attempts = s.correct + s.wrong;
      const errorRate = s.wrong / attempts;
      const daysSince = s.last ? (now - new Date(s.last).getTime()) / DAY : 30;
      return { ...it, score: errorRate * 3 + Math.min(daysSince, 14) / 14 };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, count);
}

// Lower-cased German words (letters only) — used to highlight practiced words in the chat.
export function wordSet(list) {
  const out = new Set();
  list.forEach((it) =>
    it.de
      .toLowerCase()
      .split(/[^a-zäöüß]+/)
      .filter((t) => t.length > 2)
      .forEach((t) => out.add(t))
  );
  return out;
}
