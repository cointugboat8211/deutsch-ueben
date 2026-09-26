// Offline support for the installed (Home Screen) app. Caches the app shell
// so lessons, reading and the daily review work with no signal — handy on a
// trip. The AI Tutor still needs a reachable Ollama server, so it won't work
// fully offline, but the rest of the app will.
//
// Bump CACHE_NAME whenever app files change so visitors get the new version
// instead of a stale cached one.
const CACHE_NAME = "deutsch-ueben-v3";

const APP_SHELL = [
  "./",
  "index.html",
  "manifest.json",
  "css/style.css",
  "js/app.js",
  "js/router.js",
  "js/storage.js",
  "js/speech.js",
  "js/numbers.js",
  "js/vocab.js",
  "js/exercises.js",
  "js/lessons.js",
  "js/reading.js",
  "js/conversation.js",
  "js/assessment.js",
  "js/aichat.js",
  "js/aiquestions.js",
  "js/data/lessons-data.js",
  "js/data/content-data.js",
  "js/data/dialogue-data.js",
  "js/data/assessment-data.js",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return; // never touch Ollama or other origins

  // Network-first for our own files, so a normal refresh picks up edits while
  // developing; falls back to the cache when there's no connection.
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return res;
      })
      .catch(() => caches.match(event.request).then((res) => res || caches.match("index.html")))
  );
});
