let listener = null;

export function onNavigate(cb) {
  listener = cb;
}

export function navigate(view, params = {}) {
  if (listener) listener(view, params);
}

export function showToast(message, ms = 2200) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = message;
  el.hidden = false;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    el.hidden = true;
  }, ms);
}
