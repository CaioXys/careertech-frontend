let region = null;

function getRegion() {
  if (!region) {
    region = document.createElement('div');
    region.className = 'toast-region';
    region.setAttribute('role', 'region');
    region.setAttribute('aria-label', 'Notificações');
    region.setAttribute('aria-live', 'polite');
  }

  const dialog = document.querySelector('dialog[open]');
  const parent = dialog ?? document.body;
  if (region.parentElement !== parent) parent.append(region);
  return region;
}

const icons = { success: '✓', error: '!', info: 'i' };

export function showToast(message, { tone = 'success', duration = 4200 } = {}) {
  if (!message) return () => {};
  const host = getRegion();

  while (host.children.length >= 4) host.firstElementChild.remove();

  const toast = document.createElement('div');
  toast.className = `toast toast--${tone}`;
  toast.setAttribute('role', tone === 'error' ? 'alert' : 'status');

  const icon = document.createElement('span');
  icon.className = 'toast__icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = icons[tone] ?? icons.info;

  const text = document.createElement('p');
  text.className = 'toast__body';
  text.textContent = message;

  const close = document.createElement('button');
  close.className = 'toast__close';
  close.type = 'button';
  close.setAttribute('aria-label', 'Fechar notificação');
  close.textContent = '×';

  toast.append(icon, text, close);
  host.append(toast);

  let timer = null;
  let remaining = duration;
  let startedAt = 0;
  let closing = false;

  const dismiss = () => {
    if (closing) return;
    closing = true;
    clearTimeout(timer);
    toast.classList.add('toast--closing');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
    setTimeout(() => toast.remove(), 260);
  };

  const stop = () => {
    if (!timer) return;
    clearTimeout(timer);
    timer = null;
    remaining -= Date.now() - startedAt;
  };

  const start = () => {
    if (closing || duration <= 0 || timer) return;
    startedAt = Date.now();
    timer = setTimeout(dismiss, Math.max(remaining, 1200));
  };

  close.addEventListener('click', dismiss);
  toast.addEventListener('mouseenter', stop);
  toast.addEventListener('mouseleave', start);
  toast.addEventListener('focusin', stop);
  toast.addEventListener('focusout', start);

  start();
  return dismiss;
}

export const toastSuccess = (message, options = {}) => showToast(message, { ...options, tone: 'success' });
export const toastError = (message, options = {}) => showToast(message, { ...options, tone: 'error' });
export const toastInfo = (message, options = {}) => showToast(message, { ...options, tone: 'info' });

export function clearToasts() {
  region?.replaceChildren();
}
