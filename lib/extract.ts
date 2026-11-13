import { google } from "@ai-sdk/google";
import { APICallError, RetryError, generateObject } from "ai";
import type { z } from "zod";
import { prompts, schemas, type Invoice, type Mode, type Resume } from "./schemas";

const MODELS = (
    process.env.GEMINI_MODELS ?? "gemini-flash-latest,gemini-flash-lite-latest"
).split(",").map((s) => s.trim()).filter(Boolean);

/** true, если ошибка временная: перегрузка, лимит или таймаут. */
export function isBusy(e: unknown): boolean {
  const err = RetryError.isInstance(e) ? e.lastError : e;
  if (APICallError.isInstance(err)) {
    return [429, 500, 502, 503, 504].includes(err.statusCode ?? 0);
  }
  return err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
}

export async function extract(mode: Mode, pdf: Uint8Array) {
  let lastError: unknown;
  for (const name of MODELS) {
    try {
      const { object, usage } = await generateObject({
        model: google(name),
        maxRetries: 1,
        abortSignal: AbortSignal.timeout(25_000),
        schema: schemas[mode] as z.ZodType<Invoice | Resume>,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompts[mode] },
              { type: "file", data: pdf, mediaType: "application/pdf" },
            ],
          },
        ],
      });
      return { data: object, usage, model: name };
    } catch (e) {
      lastError = e;
      if (!isBusy(e)) throw e;
    }
  }
  throw lastError;
}
