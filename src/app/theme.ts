type Theme = "dark" | "light";

const THEME_STORAGE_KEY = "theme";
const PREFERS_LIGHT = "(prefers-color-scheme: light)";

const isTheme = (value: unknown): value is Theme =>
  value === "dark" || value === "light";

const storedTheme = (): Theme | null => {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);

    return isTheme(value) ? value : null;
  } catch {
    return null;
  }
};

const storeTheme = (theme: Theme): void => {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage can be blocked (private mode); the choice then lasts the visit.
  }
};

const systemTheme = (): Theme =>
  window.matchMedia(PREFERS_LIGHT).matches ? "light" : "dark";

const currentTheme = (): Theme =>
  document.documentElement.dataset.theme === "light" ? "light" : "dark";

const applyTheme = (theme: Theme): void => {
  document.documentElement.dataset.theme = theme;
};

const subscribeTheme = (onChange: () => void): (() => void) => {
  const observer = new MutationObserver(onChange);

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  return () => {
    observer.disconnect();
  };
};

const serverTheme = (): Theme => "dark";

const THEME_INIT_SCRIPT = `(() => {
  const root = document.documentElement;
  try {
    const stored = window.localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    const theme =
      stored === "light" || stored === "dark"
        ? stored
        : window.matchMedia(${JSON.stringify(PREFERS_LIGHT)}).matches
          ? "light"
          : "dark";
    root.dataset.theme = theme;
  } catch (_) {
    root.dataset.theme = "dark";
  }
})();`;

export {
  applyTheme,
  currentTheme,
  PREFERS_LIGHT,
  serverTheme,
  storedTheme,
  storeTheme,
  subscribeTheme,
  systemTheme,
  THEME_INIT_SCRIPT,
  THEME_STORAGE_KEY,
};
export type { Theme };
