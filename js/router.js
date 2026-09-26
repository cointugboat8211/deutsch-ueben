let listener = null;

export function onNavigate(cb) {
  listener = cb;
}

export function navigate(view, params = {}) {
  if (listener) listener(view, params);
}

export function showToast(message, ms) {
  const el = document.getElementById("toast");
  if (!el) return;
  // Longer messages (e.g. explaining a mic permission problem) need more
  // time to read than a short "done!" — scale the display time to length.
  const duration = ms ?? Math.min(7000, Math.max(2200, message.length * 60));
  el.textContent = message;
  el.hidden = false;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    el.hidden = true;
  }, duration);
}
