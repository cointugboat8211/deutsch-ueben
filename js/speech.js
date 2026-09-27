// Speech utilities: German text-to-speech and speech-to-text, with fuzzy phrase matching.

import { getWhisperUrl } from "./remote.js";

let germanVoice = null;
let voicesReady = false;
const voiceListeners = [];
const VOICE_KEY = "deutschUeben_voiceName";
const RATE_KEY = "deutschUeben_speechRate";

// Prefer natural/online neural voices (Edge "Natural", Google) over the old robotic ones.
function rankVoice(v) {
  const n = v.name.toLowerCase();
  return (n.includes("natural") || n.includes("online") ? 3 : 0) + (n.includes("google") ? 2 : 0) + (v.lang === "de-DE" ? 1 : 0);
}

export function germanVoices() {
  const voices = window.speechSynthesis?.getVoices() || [];
  return voices.filter((v) => v.lang?.toLowerCase().replace("_", "-").startsWith("de")).sort((a, b) => rankVoice(b) - rankVoice(a));
}

function loadVoices() {
  const voices = window.speechSynthesis?.getVoices() || [];
  if (voices.length) {
    const all = germanVoices();
    let saved;
    try {
      saved = localStorage.getItem(VOICE_KEY);
    } catch {}
    germanVoice = (saved && all.find((v) => v.name === saved)) || all[0] || null;
    voicesReady = true;
  }
  voiceListeners.forEach((cb) => cb(germanVoice));
}

// Calls cb(voiceOrNull) now-ish and again whenever the browser finishes loading voices.
export function onVoiceStatus(cb) {
  voiceListeners.push(cb);
  if (voicesReady) cb(germanVoice);
}

export function getSelectedVoice() {
  return germanVoice;
}

// Remembers a specific voice by name (picked on the Voice settings screen) so
// it's used everywhere instead of the automatic best-guess. Pass null to go
// back to automatic.
export function setSelectedVoice(voiceName) {
  try {
    if (voiceName) localStorage.setItem(VOICE_KEY, voiceName);
    else localStorage.removeItem(VOICE_KEY);
  } catch {}
  loadVoices();
}

export function getSpeechRate() {
  try {
    return parseFloat(localStorage.getItem(RATE_KEY)) || 0.88;
  } catch {
    return 0.88;
  }
}

export function setSpeechRate(rate) {
  try {
    localStorage.setItem(RATE_KEY, String(rate));
  } catch {}
}

if (typeof window !== "undefined" && window.speechSynthesis) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

export function speakGerman(text, { rate, voice } = {}) {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) return resolve(false);
    if (!voicesReady) loadVoices();
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "de-DE";
      utter.rate = rate ?? getSpeechRate();
      // Some browsers refresh their internal voice list (after 'voiceschanged'
      // or a device/audio-output change) and then reject a voice object held
      // over from before that refresh — assigning it throws SYNCHRONOUSLY
      // ("Failed to convert value to 'SpeechSynthesisVoice'"), which would
      // otherwise escape this Promise uncaught and break whatever called us.
      const useVoice = voice || germanVoice;
      if (useVoice) {
        try {
          utter.voice = useVoice;
        } catch {
          loadVoices(); // refresh our cached voice against the current list
        }
      }
      utter.onend = () => resolve(true);
      utter.onerror = () => resolve(false);
      window.speechSynthesis.speak(utter);
    } catch {
      resolve(false);
    }
  });
}

export function speechSynthesisSupported() {
  return !!window.speechSynthesis;
}

// --- Speech recognition ---

const SpeechRecognitionCtor =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

// Safari (desktop and iOS) exposes `webkitSpeechRecognition` as a symbol, but
// it does not reliably transcribe anything in practice — it runs, ends, and
// reports nothing heard, which otherwise looks exactly like the user just
// wasn't picked up. On iPhone this affects every browser (Chrome, Edge, etc.
// all use Safari's engine there by Apple's policy), not just Safari itself.
function isSafari() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  // Every iOS browser (Safari, "Chrome"/CriOS, "Edge"/EdgiOS, ...) is required
  // by Apple to use Safari's engine, so they all inherit the same broken
  // recognition — unlike desktop, switching browsers on iOS doesn't help.
  if (/iphone|ipad|ipod/i.test(ua)) return true;
  // Desktop/Android: only genuine Safari is affected, not Chrome/Edge/Firefox.
  return /^((?!chrome|chromium|crios|edg|edgios|opr|fxios|firefox|android).)*safari/i.test(ua);
}

// Whisper (running as a companion service alongside a *remote* Ollama
// connection, e.g. on a Mac mini reached over Tailscale — see remote.js)
// gives Safari/iOS a working microphone path even though the browser's own
// recognition doesn't work there: record a short clip (audio capture itself
// works fine everywhere) and send it off for transcription instead.
function remoteListenAvailable() {
  return !!getWhisperUrl() && !!navigator.mediaDevices?.getUserMedia && typeof window.MediaRecorder !== "undefined";
}

export function speechRecognitionSupported() {
  return (!!SpeechRecognitionCtor && !isSafari()) || remoteListenAvailable();
}

// True once a mic attempt will go over the network to a remote Whisper
// server rather than the browser's own (instant, offline) recognition —
// callers can use this to show "uploading/transcribing" instead of
// "listening", since it takes a bit longer and needs a connection.
export function usingRemoteMic() {
  return (!SpeechRecognitionCtor || isSafari()) && remoteListenAvailable();
}

let activeRecognizer = null;

/**
 * Listens once for German speech. Resolves with the recognized transcript
 * (empty string if nothing heard / an error occurred / timed out). Picks
 * whichever mechanism actually works on this browser: the native, instant
 * recognizer where it's reliable, or a short recording sent to a remote
 * Whisper server where it isn't (Safari/iOS — see remoteListenAvailable).
 */
export function listenOnce(opts = {}) {
  if (SpeechRecognitionCtor && !isSafari()) return listenNative(opts);
  if (remoteListenAvailable()) return listenRemote(opts);
  return Promise.resolve({ transcript: "", error: "unsupported" });
}

function listenNative({ timeoutMs = 8000 } = {}) {
  return new Promise((resolve) => {
    // Starting microphone capture while text-to-speech audio is still playing
    // (or queued) can hang or crash the tab on some systems — audio drivers
    // and virtual devices in particular don't always cope with playback and
    // capture starting at the same instant. Fully stop any TTS first and
    // give the audio device a brief moment to settle before opening the mic.
    window.speechSynthesis?.cancel();

    const start = () => startRecognition(resolve, timeoutMs);
    if (window.speechSynthesis?.speaking || window.speechSynthesis?.pending) {
      setTimeout(start, 200);
    } else {
      start();
    }
  });
}

function startRecognition(resolve, timeoutMs) {
    const recognizer = new SpeechRecognitionCtor();
    activeRecognizer = recognizer;
    recognizer.lang = "de-DE";
    recognizer.interimResults = false;
    recognizer.maxAlternatives = 3;

    let done = false;
    const finish = (result) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      activeRecognizer = null;
      resolve(result);
    };

    const timer = setTimeout(() => {
      try {
        recognizer.stop();
      } catch {}
      finish({ transcript: "", error: "timeout" });
    }, timeoutMs);

    recognizer.onresult = (event) => {
      const alternatives = Array.from(event.results[0]).map((r) => r.transcript);
      finish({ transcript: alternatives[0] || "", alternatives, error: null });
    };

    recognizer.onerror = (event) => {
      finish({ transcript: "", error: event.error || "error" });
    };

    recognizer.onend = () => {
      finish({ transcript: "", error: "no-speech" });
    };

    // Chrome/Edge sometimes throw synchronously if a previous recognition
    // session hasn't fully released the microphone yet (common right after a
    // prior attempt just ended) — one short retry clears this almost always,
    // rather than leaving the mic looking "stuck" until the page is reloaded.
    const tryStart = (isRetry) => {
      try {
        recognizer.start();
      } catch (e) {
        if (!isRetry) setTimeout(() => tryStart(true), 350);
        else finish({ transcript: "", error: "start-failed" });
      }
    };
    tryStart(false);
}

// Records a short, fixed-length clip and sends it to a remote Whisper server
// for transcription. This is the Safari/iOS path: audio *capture* (getUserMedia
// + MediaRecorder) works fine in every browser, it's specifically the live,
// browser-built-in recognition that Safari can't do reliably.
function pickAudioMimeType() {
  const candidates = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"];
  for (const c of candidates) {
    if (window.MediaRecorder.isTypeSupported?.(c)) return c;
  }
  return "";
}

// recordMs is a safety cap, not the primary UX — the caller is expected to
// call stopListening() as soon as the user is done talking (tap-to-stop),
// since a fixed recording length either cuts off longer phrases mid-word or
// wastes several seconds of silence after a short one. Both hurt Whisper's
// accuracy: it has no live silence detection like the native recognizer does.
function listenRemote({ timeoutMs = 15000, recordMs = 12000 } = {}) {
  return new Promise(async (resolve) => {
    const whisperUrl = getWhisperUrl();
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      return resolve({ transcript: "", error: "not-allowed" });
    }

    const mimeType = pickAudioMimeType();
    let recorder;
    try {
      recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    } catch {
      stream.getTracks().forEach((t) => t.stop());
      return resolve({ transcript: "", error: "unsupported" });
    }
    activeRecognizer = { stop: () => recorder.state !== "inactive" && recorder.stop() };

    const chunks = [];
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);

    recorder.onstop = async () => {
      activeRecognizer = null;
      stream.getTracks().forEach((t) => t.stop());
      if (!chunks.length) return resolve({ transcript: "", error: "no-speech" });
      const blob = new Blob(chunks, { type: mimeType || chunks[0].type });
      try {
        const res = await fetch(whisperUrl, {
          method: "POST",
          headers: { "Content-Type": blob.type || "application/octet-stream" },
          body: blob,
          signal: AbortSignal.timeout(timeoutMs),
        });
        if (!res.ok) return resolve({ transcript: "", error: "network" });
        const data = await res.json();
        if (!data.transcript) return resolve({ transcript: "", error: data.error || "no-speech" });
        resolve({ transcript: data.transcript, alternatives: data.alternatives?.length ? data.alternatives : [data.transcript], error: null });
      } catch {
        resolve({ transcript: "", error: "network" });
      }
    };

    try {
      recorder.start();
    } catch {
      stream.getTracks().forEach((t) => t.stop());
      return resolve({ transcript: "", error: "start-failed" });
    }
    setTimeout(() => {
      if (recorder.state !== "inactive") recorder.stop();
    }, recordMs);
  });
}

// Turns a recognition error code into a message that actually explains what
// to do next, instead of a generic "didn't catch that" for every failure.
export function micErrorMessage(error) {
  switch (error) {
    case "not-allowed":
    case "service-not-allowed":
      return "Microphone access is blocked for this site. Click the 🔒 or camera/mic icon in the address bar, allow the microphone, then try again.";
    case "audio-capture":
      return "No microphone found. Check one is connected and not in use by another app.";
    case "network":
      return "Speech recognition needs an internet connection.";
    case "aborted":
    case "start-failed":
      return "The microphone got stuck for a moment. Try again — if it keeps happening, reload the page.";
    case "unsupported":
      return "Speech recognition isn't reliable in Safari (on iPhone, every browser uses Safari's engine). Connect a computer under AI Tutor to enable voice input here, use Chrome/Edge on a computer, or just type instead.";
    case "no-speech":
    case "timeout":
      return "Didn't hear anything. Tap the mic and try again, a little closer or louder.";
    default:
      return "Something went wrong with the microphone. Try again, or type instead.";
  }
}

export function stopListening() {
  if (activeRecognizer) {
    try {
      activeRecognizer.stop();
    } catch {}
  }
}

// --- Text normalization + fuzzy matching ---

export function normalizeGerman(text) {
  return text
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[.,!?¿¡'"„“”\-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

function similarity(a, b) {
  const maxLen = Math.max(a.length, b.length) || 1;
  return 1 - levenshtein(a, b) / maxLen;
}

/**
 * Checks whether a spoken transcript matches one of the accepted phrase
 * variants for a dialogue node. Tolerant of imperfect recognition:
 * accepts on whole-phrase similarity, substring containment, or enough
 * shared keywords.
 */
export function matchesExpected(transcript, acceptedVariants) {
  const heard = normalizeGerman(transcript);
  if (!heard) return false;

  for (const variant of acceptedVariants) {
    const target = normalizeGerman(variant);
    if (!target) continue;

    if (heard === target) return true;
    if (heard.includes(target) || target.includes(heard)) return true;
    if (similarity(heard, target) >= 0.72) return true;

    const targetWords = target.split(" ").filter((w) => w.length > 2);
    const heardWords = new Set(heard.split(" "));
    if (targetWords.length) {
      const hits = targetWords.filter((w) => heardWords.has(w)).length;
      if (hits / targetWords.length >= 0.6) return true;
    }
  }
  return false;
}

/**
 * Strict matcher for typed quiz answers: must equal an accepted answer after
 * normalization, allowing one typo on longer answers. (matchesExpected is
 * deliberately forgiving for noisy speech recognition and is NOT used here.)
 */
export function matchesTyped(text, acceptedAnswers) {
  const typed = normalizeGerman(text);
  if (!typed) return false;
  return acceptedAnswers.some((a) => {
    const target = normalizeGerman(a);
    if (typed === target) return true;
    return target.length >= 8 && levenshtein(typed, target) <= 1;
  });
}
