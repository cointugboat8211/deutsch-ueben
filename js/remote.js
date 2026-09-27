// The remote AI server (Ollama, and now also the Whisper transcription
// server sitting alongside it) that this device talks to. Defaults to this
// device's own localhost — the normal case when the app and Ollama are on
// the same computer. On a phone, "localhost" means the phone itself, so it
// can be pointed at a computer's Tailscale address instead (set on the AI
// Tutor page) to reach the same free local AI/speech setup from anywhere.

const DEFAULT_OLLAMA = "http://localhost:11434";
const OLLAMA_KEY = "deutschUeben_ollamaBase";

export function getOllamaBase() {
  try {
    return (localStorage.getItem(OLLAMA_KEY) || DEFAULT_OLLAMA).replace(/\/$/, "");
  } catch {
    return DEFAULT_OLLAMA;
  }
}

export function setOllamaBase(url) {
  try {
    if (!url || url === DEFAULT_OLLAMA) localStorage.removeItem(OLLAMA_KEY);
    else localStorage.setItem(OLLAMA_KEY, url.trim().replace(/\/$/, ""));
  } catch {}
}

export function isRemoteOllama() {
  return getOllamaBase() !== DEFAULT_OLLAMA;
}

// The Whisper transcription server only makes sense alongside a *remote*
// Ollama connection (it's set up as a companion service on that same
// machine, at /whisper on the same host) — there's no local counterpart to
// fall back to, so this is null unless a remote server is configured.
export function getWhisperUrl() {
  return isRemoteOllama() ? `${getOllamaBase()}/whisper/transcribe` : null;
}
