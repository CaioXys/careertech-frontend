const themeStorageKey = 'careertech-theme';
export const THEME_EVENT = 'careertech:theme';
const systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');

function getStoredTheme() {
  const storedTheme = localStorage.getItem(themeStorageKey);
  return storedTheme === 'dark' || storedTheme === 'light' ? storedTheme : null;
}

function publishTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: theme }));
}

export function getTheme() {
  const storedTheme = getStoredTheme();
  if (storedTheme) return storedTheme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme() {
  const theme = getTheme();
  publishTheme(theme);
  return theme;
}

export function setTheme(theme) {
  if (theme !== 'dark' && theme !== 'light') {
    throw new Error(`Tema inválido: ${theme}`);
  }

  localStorage.setItem(themeStorageKey, theme);
  publishTheme(theme);
  return theme;
}

systemThemeQuery.addEventListener('change', () => {
  if (!getStoredTheme()) applyTheme();
});
