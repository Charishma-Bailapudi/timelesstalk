import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { personas as defaultPersonas, Persona } from "@/data/personas";

const customPersonasPath = path.join(
  process.cwd(),
  "data",
  "custom-personas.json",
);

export function getAllPersonas(): Persona[] {
  return [...defaultPersonas, ...readCustomPersonas()];
}

export function getPersonaById(id: string): Persona | undefined {
  return getAllPersonas().find((persona) => persona.id === id);
}

export function saveCustomPersona(persona: Persona): void {
  const directory = path.dirname(customPersonasPath);
  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true });
  }

  const customPersonas = readCustomPersonas();
  const withoutDuplicate = customPersonas.filter(
    (existing) => existing.id !== persona.id,
  );

  writeFileSync(
    customPersonasPath,
    JSON.stringify([...withoutDuplicate, persona], null, 2),
    "utf8",
  );
}

function readCustomPersonas(): Persona[] {
  if (!existsSync(customPersonasPath)) {
    return [];
  }

  try {
    const parsed = JSON.parse(
      readFileSync(customPersonasPath, "utf8"),
    ) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isCustomPersona);
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
