# DocParse AI

Upload an invoice or résumé as a PDF and get structured data back: a clean table, JSON, and CSV.

**Stack:** Next.js 15 (App Router), TypeScript, Tailwind 4, Vercel AI SDK (`generateObject`), Zod, Gemini API (free tier), Upstash Ratelimit.

[Live demo](https://your-app.vercel.app) · [Code](https://github.com/you/docparse-ai)

![DocParse AI screenshot](docs/screenshot.png)

## How it works

1. The browser sends a PDF to `/api/parse`.
2. The route passes the PDF straight to Gemini and asks for an object matching a Zod schema.
3. `generateObject` guarantees valid, typed JSON. Schemas live in `lib/schemas.ts`.
4. The result is shown as a table with one-click JSON copy and CSV export.

## Quality checks

- **Arithmetic validation** (`lib/validate.ts`): the code recomputes line totals, subtotal, tax, and grand total, and flags the document for manual review when the numbers don't add up. The model's output is never trusted blindly.
- **Evals** (`npm run eval`): runs the extractor over labeled PDFs in `evals/cases` and reports per-field accuracy in `evals/results.md`. See `evals/README.md`.

Accuracy on the test set: _fill in after your first run_

## Reliability and cost control

- **Model fallback:** if the first model is overloaded (503/429), the next one in `GEMINI_MODELS` is tried, with a short timeout so the request fits Vercel's 60 s limit.
- **Access key:** parsing your own files requires a key (`ACCESS_KEYS`, sent as the `x-access-key` header). The "Try a sample" button works without a key and makes no API calls.
- **Rate limiting:** 5 parses per hour per IP via Upstash (disabled locally if Upstash is not configured).
- **Limits:** PDFs up to 4 MB (Vercel's request body limit is ~4.5 MB).

## Getting started

```bash
npm install
cp .env.example .env.local   # add GOOGLE_GENERATIVE_AI_API_KEY
npm run dev
```

Get a free API key at [Google AI Studio](https://aistudio.google.com/apikey). No credit card needed.

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `GOOGLE_GENERATIVE_AI_API_KEY` | yes | Gemini API key |
| `ACCESS_KEYS` | in production | Comma-separated access keys for the parse API |
| `GEMINI_MODELS` | no | Comma-separated model list, tried in order |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | recommended | Enables rate limiting |

## Deploy to Vercel

1. Push the repository to GitHub.
2. In Vercel: Add New Project → import the repository.
3. Add the environment variables above (use a long random value for `ACCESS_KEYS`, e.g. `openssl rand -hex 16`).
4. Deploy.

## Privacy note

On Gemini's free tier, Google may use submitted content to improve its products. Use fictional or non-sensitive documents for demos.

## Access to the live demo

Parsing custom files requires an access key. Contact me for one, or use the built-in sample.