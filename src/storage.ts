import type { AppState } from "./types";

const STORAGE_KEY = "monthly-money-memo-web:v1";

export const emptyState: AppState = {
  genres: [],
  records: []
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
