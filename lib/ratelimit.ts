import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const configured =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

const limiter = configured
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, "1 h"),
      prefix: "docparse",
    })
  : null;

export async function allow(ip: string): Promise<boolean> {
  if (!limiter) return true;
  const { success } = await limiter.limit(ip);
  return success;
}
