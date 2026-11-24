import { Redis } from "@upstash/redis";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  parts: Array<{
    type: "text";
    text: string;
  }>;
}

const CHAT_HISTORY_TTL_SECONDS = 86400;
const CHAT_HISTORY_MAX_MESSAGES = 20;

function getRedis(): Redis | null {
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    console.warn(
      "[Redis] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is missing.",
    );
    return null;
  }

  return Redis.fromEnv();
}

export async function getChatHistory(
  sessionKey: string,
): Promise<ChatMessage[]> {
  const redis = getRedis();
  if (!redis) {
    return [];
  }

  try {
    const messages = await redis.get<ChatMessage[]>(sessionKey);
    return Array.isArray(messages) ? messages.slice(-CHAT_HISTORY_MAX_MESSAGES) : [];
  } catch (error) {
    console.warn(`[Redis] Could not read chat history "${sessionKey}".`, error);
    return [];
  }
}

export async function saveChatHistory(
  sessionKey: string,
  messages: ChatMessage[],
): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    return;
  }

  try {
    await redis.set(
      sessionKey,
      messages.slice(-CHAT_HISTORY_MAX_MESSAGES),
      { ex: CHAT_HISTORY_TTL_SECONDS },
    );
  } catch (error) {
    console.warn(`[Redis] Could not save chat history "${sessionKey}".`, error);
  }
}

export async function clearChatHistory(sessionKey: string): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    return;
  }

  try {
    await redis.del(sessionKey);
  } catch (error) {
    console.warn(`[Redis] Could not clear chat history "${sessionKey}".`, error);
  }
}
