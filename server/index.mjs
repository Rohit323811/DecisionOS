/**
 * DecisionOS analysis server.
 *
 * Holds OPENAI_API_KEY server-side and exposes a single POST /api/analyze
 * endpoint that turns a free-form situation description into a structured,
 * schema-validated DecisionModel. The browser never sees the key.
 *
 * Run: `node server/index.mjs` (or `npm run dev:all` for server + Vite).
 */
import express from 'express';
import OpenAI from 'openai';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// Minimal .env loader (no dependency on dotenv)
const envPath = path.join(ROOT, '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const requestedPort = Number(process.env.PORT);
const PORT = Number.isFinite(requestedPort) && requestedPort > 0 ? requestedPort : 8787;
const MODEL_NAME = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const API_KEY = process.env.OPENAI_API_KEY || '';

const app = express();
app.use(express.json({ limit: '64kb' }));

const VALID_KINDS = ['decision', 'option', 'input', 'variable', 'computed', 'goal', 'constraint', 'impact', 'assumption', 'unknown'];
const VALID_REL = ['direct', 'inverse', 'constrains', 'drives', 'mitigates', 'depends'];
const VALID_VAR_TYPES = ['number', 'percentage', 'currency', 'duration', 'date', 'boolean', 'choice', 'scale', 'text', 'unknown'];

const SYSTEM_PROMPT = `You are the model-extraction engine of DecisionOS, a decision-modeling application.
You read a messy, real-world decision described in natural language and return ONE JSON object that formalizes it as a dependency model.

Rules:
- Output STRICT JSON only. No markdown, no commentary.
- Decide yourself how many items the situation needs: there is no required count of goals, options, variables, constraints, unknowns or assumptions. A simple decision may yield 6 nodes, a tangled one 20.
- Every item gets a short stable id (e.g. "v-college-hours"). Relationships reference ids, never names.
- Choose the correct variableType for every variable/input/computed item from: number, percentage, currency, duration, date, boolean, choice, scale, text, unknown. Do not force everything into one type.
- Distinguish origin precisely: "user" for facts the user stated, "inferred" for conclusions you drew, "unknown" for information the user does not have. NEVER invent a value for an unknown — unknowns carry no value.
- Numeric input/variable items must include min, max, value (a plausible current value consistent with the text), and unit.
- Include 8-20 relationships (edges) with a relationshipType: direct, inverse, constrains, drives, mitigates, depends — plus a one-sentence explanation of the mechanism.
- Include 1-5 consequences: downstream outcomes that matter for this decision, each tied to a driver item id.
- The summary must describe the structural conflict of the decision in 2-3 sentences, neutrally. You do not recommend anything.

JSON shape:
{
  "title": string,
  "summary": string,
  "items": [ { "id": string, "kind": one of ${JSON.stringify(VALID_KINDS)}, "label": string, "detail": string,
               "origin": "user"|"inferred"|"unknown", "confidence"?: "high"|"medium"|"low",
               "variableType"?: one of ${JSON.stringify(VALID_VAR_TYPES)},
               "value"?: number|string|boolean, "min"?: number, "max"?: number, "unit"?: string,
               "selectOptions"?: string[], "computedFormula"?: string,
               "polarity"?: "positive"|"negative"|"warning"|"neutral",
               "facts"?: [ { "label": string, "value": string } ] } ],
  "edges": [ { "id": string, "from": itemId, "to": itemId, "relationshipType": one of ${JSON.stringify(VALID_REL)}, "explanation": string, "confidence"?: "high"|"medium"|"low" } ],
  "consequences": [ { "id": string, "label": string, "detail": string, "polarity": "positive"|"negative"|"warning"|"neutral", "driver": itemId } ]
}`;

app.post('/api/analyze', async (req, res) => {
  const started = Date.now();
  const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';

  if (!prompt) return res.status(400).json({ error: 'Empty input — describe the decision first.' });
  if (prompt.length < 20) return res.status(400).json({ error: 'Input too short to model. Add more context.' });

  if (!API_KEY) {
    return res.status(503).json({
      error: 'No OPENAI_API_KEY configured on the server. Add it to DecisionOS/.env and restart, or use demo mode.',
      code: 'missing_api_key',
    });
  }

  const openai = new OpenAI({ apiKey: API_KEY });

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL_NAME,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Model this decision:\n\n"""${prompt}"""`,
        },
      ],
    });

    const text = completion.choices?.[0]?.message?.content ?? '';
    let raw;
    try {
      raw = JSON.parse(text);
    } catch {
      return res.status(502).json({ error: 'Model returned invalid JSON.', code: 'invalid_json' });
    }

    // Server-side sanity gate: the client validator is authoritative, but we
    // refuse to forward obviously empty structures so errors are precise.
    if (!Array.isArray(raw?.items) || raw.items.length === 0) {
      return res.status(502).json({ error: 'Model returned no decision items.', code: 'empty_model' });
    }

    return res.json({
      model: raw,
      meta: { source: 'ai', latencyMs: Date.now() - started, engine: MODEL_NAME },
    });
  } catch (err) {
    const msg = err?.message || 'Unknown OpenAI error';
    const status = err?.status ?? 500;
    // Surface rate limits / auth problems clearly but never echo the key.
    return res.status(status >= 400 && status < 600 ? status : 500).json({
      error: `OpenAI request failed: ${msg}`,
      code: 'openai_error',
    });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, hasKey: Boolean(API_KEY), model: MODEL_NAME });
});

app.listen(PORT, () => {
  console.log(`[decisionos] analysis API listening on http://localhost:${PORT}`);
  console.log(`[decisionos] OPENAI_API_KEY: ${API_KEY ? 'configured' : 'MISSING — demo mode only'}`);
});
