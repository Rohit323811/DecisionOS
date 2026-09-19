import { DecisionModel } from '../types/decision';

/**
 * LocalStorage persistence — survives refresh, fails silently on private-mode
 * browsers that block storage. The active model, active scenario and UI prefs
 * are the entire persisted surface; there is nothing else to lose.
 */

const MODEL_KEY = 'decisionos.model.v1';
const SCENARIO_KEY = 'decisionos.scenario.v1';
const PREFS_KEY = 'decisionos.prefs.v1';

export interface UIPrefs {
  showFlowAnimation: boolean;
}

export function loadModel(): DecisionModel | null {
  try {
    const raw = window.localStorage.getItem(MODEL_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.items) || parsed.items.length === 0) {
      return null;
    }
    return parsed as DecisionModel;
  } catch {
    return null; // corrupt state — start clean rather than crash
  }
}

export function saveModel(model: DecisionModel | null): void {
  try {
    if (!model) window.localStorage.removeItem(MODEL_KEY);
    else window.localStorage.setItem(MODEL_KEY, JSON.stringify(model));
  } catch {
    /* storage unavailable — persistence is best-effort */
  }
}

export function loadActiveScenario(): string | null {
  try {
    return window.localStorage.getItem(SCENARIO_KEY);
  } catch {
    return null;
  }
}

export function saveActiveScenario(id: string | null): void {
  try {
    if (id) window.localStorage.setItem(SCENARIO_KEY, id);
    else window.localStorage.removeItem(SCENARIO_KEY);
  } catch {
    /* best-effort */
  }
}

export function loadPrefs(): UIPrefs {
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && typeof parsed.showFlowAnimation === 'boolean') {
        return parsed as UIPrefs;
      }
    }
  } catch {
    /* fall through */
  }
  return { showFlowAnimation: true };
}

export function savePrefs(prefs: UIPrefs): void {
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* best-effort */
  }
}

export function clearAll(): void {
  try {
    window.localStorage.removeItem(MODEL_KEY);
    window.localStorage.removeItem(SCENARIO_KEY);
  } catch {
    /* best-effort */
  }
}
