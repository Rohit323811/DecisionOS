import type { DecisionModel } from '../types/decision';
import { demoDecision } from '../data/demoModel';
import { validateRawModel } from '../utils/modelValidator';
import { normalizeModel } from '../utils/modelNormalizer';

/**
 * decisionAI — the ONLY module the UI uses to reach the analysis backend.
 * React components never see fetch details, key names, or OpenAI itself.
 *
 * The browser posts the raw situation to `/api/analyze`; a local Express
 * server holds OPENAI_API_KEY server-side, calls OpenAI with a strict JSON
 * schema, validates + normalizes the reply, and returns a DecisionModel.
 * No secret key ever ships in client JavaScript.
 */

export type AIErrorKind =
  | 'empty_input'
  | 'network'
  | 'server_missing_key'
  | 'server_error'
  | 'invalid_json'
  | 'schema_validation'
  | 'aborted';

export class AIError extends Error {
  kind: AIErrorKind;
  /** UI action label, e.g. "Retry analysis" */
  hint?: string;

  constructor(kind: AIErrorKind, message: string, hint?: string) {
    super(message);
    this.name = 'AIError';
    this.kind = kind;
    this.hint = hint;
  }
}

export interface AnalyzeResponse {
  model: DecisionModel;
  meta: {
    source: 'ai' | 'demo';
    latencyMs?: number;
    warnings: string[];
    fallback?: boolean;
    fallbackReason?: string;
  };
}

/** Fired at each analysis stage so the Analysis page can show real progress. */
export type StageListener = (stageIndex: number) => void;

export const ANALYSIS_STAGES = [
  'Analyzing decision',
  'Identifying goals',
  'Finding variables',
  'Detecting constraints',
  'Mapping dependencies',
  'Building model',
] as const;

const DEFAULT_TIMEOUT_MS = 60_000;

export function validatePrompt(prompt: string): string | null {
  const trimmed = prompt.trim();
  if (!trimmed) return 'Describe your decision before analyzing.';
  if (trimmed.length < 20) return 'Add a bit more context — at least a full sentence.';
  return null;
}

export async function analyzeDecision(
  prompt: string,
  onStage?: StageListener,
  signal?: AbortSignal,
): Promise<AnalyzeResponse> {
  const validation = validatePrompt(prompt);
  if (validation) throw new AIError('empty_input', validation);
  onStage?.(0);

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  if (signal) signal.addEventListener('abort', () => controller.abort(), { once: true });

  try {
    onStage?.(1);
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
      signal: controller.signal,
    });

    if (res.status === 503) {
      const body = await res.json().catch(() => ({}));
      throw new AIError('server_missing_key', body?.error ?? 'No API key configured on the server.', 'Run in demo mode');
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new AIError('server_error', body?.error ?? `Analysis request failed (${res.status})`, 'Try again');
    }

    onStage?.(2);
    const text = await res.text();
    let payload: any;
    try {
      payload = JSON.parse(text);
    } catch {
      throw new AIError('invalid_json', 'The analysis server returned a malformed response.', 'Try again');
    }
    onStage?.(3);

    const rawModel = payload?.model ?? payload;
    const result = validateRawModel(rawModel);
    if (!result.ok || !result.model) {
      // Malformed-but-present payloads degrade to demo rather than crashing.
      const detail = result.errors.join(' ') || 'Schema validation failed.';
      throw new AIError('schema_validation', detail, 'Use demo model');
    }
    onStage?.(4);

    const model = normalizeModel(result.model);
    onStage?.(5);

    return {
      model,
      meta: {
        source: model.source ?? 'ai',
        latencyMs: payload?.meta?.latencyMs,
        warnings: result.warnings ?? [],
      },
    };
  } catch (err: any) {
    if (err instanceof AIError) throw err;
    if (err?.name === 'AbortError') {
      throw new AIError('aborted', 'The analysis request timed out.', 'Try again');
    }
    throw new AIError('network', 'Could not reach the analysis server. Is `npm run dev:all` running?', 'Use demo model');
  } finally {
    window.clearTimeout(timer);
  }
}

/** Demo path — identical schema, clearly marked, zero network calls. */
export function buildDemoModel(prompt: string): AnalyzeResponse {
  const model = normalizeModel({ ...demoDecision, prompt: prompt.trim() || demoDecision.prompt });
  return {
    model,
    meta: { source: 'demo', warnings: [], fallback: true, fallbackReason: 'demo-mode' },
  };
}
