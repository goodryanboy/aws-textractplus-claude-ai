import { Redis } from "@upstash/redis";

const OCR_LIMIT = 30;
const OCR_COUNT_KEY = "trakie:ocr_request_count";

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (url && token) {
    redis = new Redis({ url, token });
    return redis;
  }
  return null;
}

const inMemoryCount = { count: 0 };

export async function checkAndIncrementOcrLimit(): Promise<{ allowed: boolean; remaining: number }> {
  const client = getRedis();

  if (client) {
    const count = await client.incr(OCR_COUNT_KEY);
    const remaining = Math.max(0, OCR_LIMIT - count);
    return { allowed: count <= OCR_LIMIT, remaining };
  }

  inMemoryCount.count += 1;
  const remaining = Math.max(0, OCR_LIMIT - inMemoryCount.count);
  return { allowed: inMemoryCount.count <= OCR_LIMIT, remaining };
}
