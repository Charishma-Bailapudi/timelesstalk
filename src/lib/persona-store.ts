import { personas as defaultPersonas, Persona } from "@/data/personas";
import { Redis } from "@upstash/redis";

const CUSTOM_PERSONAS_KEY = "personas:custom";

function getRedis(): Redis | null {
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    console.warn(
      "[Persona Store] Upstash Redis environment variables are missing.",
    );
    return null;
  }

  return Redis.fromEnv();
}

export async function getAllPersonas(): Promise<Persona[]> {
  return [...defaultPersonas, ...(await readCustomPersonas())];
}

export async function getPersonaById(
  id: string,
): Promise<Persona | undefined> {
  return (await getAllPersonas()).find((persona) => persona.id === id);
}

export async function saveCustomPersona(persona: Persona): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    return;
  }

  try {
    const customPersonas = await readCustomPersonas();
    const withoutDuplicate = customPersonas.filter(
      (existing) => existing.id !== persona.id,
    );
    await redis.set(CUSTOM_PERSONAS_KEY, [
      ...withoutDuplicate,
      persona,
    ]);
  } catch (error) {
    console.warn("[Persona Store] Could not save custom persona.", error);
  }
}

export async function deleteCustomPersona(
  id: string,
  userId: string,
): Promise<"deleted" | "not-found" | "forbidden"> {
  const redis = getRedis();
  if (!redis) {
    throw new Error("Upstash Redis is not configured.");
  }

  const parsed = await redis.get<unknown>(CUSTOM_PERSONAS_KEY);
  const customPersonas = Array.isArray(parsed)
    ? parsed.filter(isCustomPersona)
    : [];
  const persona = customPersonas.find((entry) => entry.id === id);

  if (!persona) {
    return "not-found";
  }
  if (persona.createdBy !== userId) {
    return "forbidden";
  }

  await redis.set(
    CUSTOM_PERSONAS_KEY,
    customPersonas.filter((entry) => entry.id !== id),
  );
  return "deleted";
}

async function readCustomPersonas(): Promise<Persona[]> {
  const redis = getRedis();
  if (!redis) {
    return [];
  }

  try {
    const parsed = await redis.get<unknown>(CUSTOM_PERSONAS_KEY);
    return Array.isArray(parsed) ? parsed.filter(isCustomPersona) : [];
  } catch (error) {
    console.warn("[Persona Store] Could not read custom personas.", error);
    return [];
  }
}

function isCustomPersona(value: unknown): value is Persona {
  if (!value || typeof value !== "object") {
    return false;
  }

  const persona = value as Partial<Persona>;
  return (
    typeof persona.id === "string" &&
    typeof persona.name === "string" &&
    typeof persona.title === "string" &&
    typeof persona.tagline === "string" &&
    typeof persona.systemPrompt === "string" &&
    typeof persona.createdBy === "string" &&
    persona.isCustom === true
  );
}
