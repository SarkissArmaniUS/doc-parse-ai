import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const configured =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

const limiter = configured
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, "1 h"), // 5 parses per hour per IP
      prefix: "docparse",
    })
  : null;

/** Returns true if the request is allowed. Without Upstash the limit is off (local development). */
export async function allow(ip: string): Promise<boolean> {
  if (!limiter) return true;
  const { success } = await limiter.limit(ip);
  return success;
}
