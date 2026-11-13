import { createHash, timingSafeEqual } from "node:crypto";

const hash = (s: string) => createHash("sha256").update(s).digest();

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
