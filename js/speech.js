// Speech utilities: German text-to-speech and speech-to-text, with fuzzy phrase matching.

let germanVoice = null;
let voicesReady = false;
const voiceListeners = [];

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
    germanVoice = germanVoices()[0] || null;
    voicesReady = true;
  }
  voiceListeners.forEach((cb) => cb(germanVoice));
}

// Calls cb(voiceOrNull) now-ish and again whenever the browser finishes loading voices.
export function onVoiceStatus(cb) {
  voiceListeners.push(cb);
  if (voicesReady) cb(germanVoice);
}

if (typeof window !== "undefined" && window.speechSynthesis) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

export function speakGerman(text, { rate = 0.88 } = {}) {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) return resolve(false);
    if (!voicesReady) loadVoices();
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "de-DE";
    utter.rate = rate;
    if (germanVoice) utter.voice = germanVoice;
    utter.onend = () => resolve(true);
    utter.onerror = () => resolve(false);
    window.speechSynthesis.speak(utter);
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

export function speechRecognitionSupported() {
  return !!SpeechRecognitionCtor;
}

let activeRecognizer = null;

/**
 * Listens once for German speech. Resolves with the recognized transcript
 * (empty string if nothing heard / an error occurred / timed out).
 */
export function listenOnce({ timeoutMs = 8000 } = {}) {
  return new Promise((resolve) => {
    if (!SpeechRecognitionCtor) return resolve({ transcript: "", error: "unsupported" });

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

    try {
      recognizer.start();
    } catch (e) {
      finish({ transcript: "", error: "start-failed" });
    }
  });
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
