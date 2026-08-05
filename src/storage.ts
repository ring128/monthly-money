import type { AppSettings, AppState } from "./types";

const STORAGE_KEY = "monthly-money-memo-web:v1";
const SETTINGS_KEY = "monthly-money-memo-web:settings:v1";

export const emptyState: AppState = {
  genres: [],
  records: []
};

export const defaultSettings: AppSettings = {
  showIncome: true,
  imageEnabled: true,
  monthStartDay: 1
};

export const loadState = (): AppState => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return emptyState;

  try {
    const parsed = JSON.parse(raw) as AppState;
    return normalizeState(parsed);
  } catch {
    return emptyState;
  }
};

export const saveState = (state: AppState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const normalizeState = (state: AppState): AppState => ({
  genres: Array.isArray(state.genres) ? state.genres : [],
  records: Array.isArray(state.records) ? state.records : []
});

export const loadSettings = (): AppSettings => {
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) return defaultSettings;

  try {
    return normalizeSettings(JSON.parse(raw) as Partial<AppSettings>);
  } catch {
    return defaultSettings;
  }
};

export const saveSettings = (settings: AppSettings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const normalizeSettings = (settings: Partial<AppSettings>): AppSettings => ({
  showIncome: typeof settings.showIncome === "boolean" ? settings.showIncome : defaultSettings.showIncome,
  imageEnabled: typeof settings.imageEnabled === "boolean" ? settings.imageEnabled : defaultSettings.imageEnabled,
  monthStartDay: normalizeMonthStartDay(settings.monthStartDay)
});

const normalizeMonthStartDay = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.min(31, Math.max(1, Math.trunc(value)))
    : defaultSettings.monthStartDay;
