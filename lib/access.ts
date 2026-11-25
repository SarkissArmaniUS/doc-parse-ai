import { createHash, timingSafeEqual } from "node:crypto";

const hash = (s: string) => createHash("sha256").update(s).digest();

/**
 * Access keys come from ACCESS_KEYS (comma-separated), e.g. "recruiter-anna,client-bob".
 * Each person can get their own key, and a key is revoked by removing it from the list.
 * If the variable is not set: open locally, closed in production (safe by default).
 */
export function hasAccess(req: Request): boolean {
  const keys = (process.env.ACCESS_KEYS ?? "").split(",").map((k) => k.trim()).filter(Boolean);
  if (keys.length === 0) return process.env.NODE_ENV !== "production";

  const given = req.headers.get("x-access-key")?.trim();
  if (!given) return false;

  const g = hash(given);
  let ok = false;
  for (const k of keys) if (timingSafeEqual(g, hash(k))) ok = true;
  return ok;
}
