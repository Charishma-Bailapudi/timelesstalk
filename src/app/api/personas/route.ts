import { auth } from "@clerk/nextjs/server";
import { google } from "@ai-sdk/google";
import { Pinecone } from "@pinecone-database/pinecone";
import { embedMany, generateText } from "ai";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  deleteCustomPersona,
  saveCustomPersona,
} from "@/lib/persona-store";
import { Persona } from "@/data/personas";

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: "You must be signed in to create a persona." },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Malformed JSON request body." },
      { status: 400 },
    );
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "Request body must be a JSON object." },
      { status: 400 },
    );
  }

  const { name, description, knowledgeText } = body as {
    name?: unknown;
    description?: unknown;
    knowledgeText?: unknown;
  };

  if (
    typeof name !== "string" ||
    !name.trim() ||
    (description !== undefined && typeof description !== "string")
  ) {
    return NextResponse.json(
      { error: "A valid name and optional description are required." },
      { status: 400 },
    );
  }

  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  const id = `${slug || "persona"}-${randomUUID().slice(0, 8)}`;

  const personaDescription =
    typeof description === "string" && description.trim()
      ? description.trim()
      : undefined;
  const generated = await generatePersonaDetails(
    name.trim(),
    personaDescription,
  );

  const persona: Persona = {
    id,
    name: name.trim(),
    description: generated.description,
    title: generated.title,
    tagline: generated.tagline,
    systemPrompt: generated.systemPrompt,
    createdBy: userId,
    isCustom: true,
  };

  await saveCustomPersona(persona);

  const knowledge =
    typeof knowledgeText === "string" && knowledgeText.trim()
      ? {
          text: knowledgeText.trim(),
          source: `${name.trim()} knowledge base`,
        }
      : await fetchWikipediaKnowledge(name.trim());

  if (knowledge) {
    try {
      if (!process.env.PINECONE_API_KEY) {
        throw new Error("PINECONE_API_KEY is missing.");
      }

      const chunks = chunkKnowledgeText(knowledge.text);
      if (chunks.length > 0) {
        const { embeddings } = await embedMany({
          model: google.embedding("gemini-embedding-001"),
          values: chunks,
          dimensions: 768,
        });

        if (
          embeddings.length !== chunks.length ||
          embeddings.some((embedding) => embedding.length !== 768)
        ) {
          throw new Error(
            "The Gemini embedding model did not return 768 dimensions.",
          );
        }

        const pinecone = new Pinecone({
          apiKey: process.env.PINECONE_API_KEY,
        });
        const indexName =
          process.env.PINECONE_INDEX_NAME || "timelesstalk";
        const namespace = pinecone.index(indexName).namespace(id);

        await namespace.upsert({
          records: chunks.map((text, index) => ({
            id: `${id}-chunk-${index + 1}`,
            values: embeddings[index],
            metadata: {
              text,
              source: knowledge.source,
            },
          })),
        });
      }
    } catch (error) {
      console.error(
        `[Persona Ingestion] Failed to index persona "${id}".`,
        error,
      );
      return NextResponse.json(
        {
          error:
            "The persona was saved, but its knowledge base could not be indexed.",
        },
        { status: 500 },
      );
    }
  } else {
    console.info(
      `[Persona Ingestion] No Wikipedia extract found for "${name.trim()}"; saved without knowledge vectors.`,
    );
  }

  return NextResponse.json({ persona }, { status: 201 });
}

export async function DELETE(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: "You must be signed in to delete a persona." },
      { status: 401 },
    );
  }

  const personaId = new URL(request.url).searchParams.get("id");
  if (!personaId) {
    return NextResponse.json(
      { error: "A persona id is required." },
      { status: 400 },
    );
  }

  try {
    const result = await deleteCustomPersona(personaId, userId);
    if (result === "not-found") {
      return NextResponse.json(
        { error: "Custom persona not found." },
        { status: 404 },
      );
    }
    if (result === "forbidden") {
      return NextResponse.json(
        { error: "You can only delete personas you created." },
        { status: 403 },
      );
    }

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("[Persona Deletion] Could not delete persona.", error);
    return NextResponse.json(
      { error: "The persona could not be deleted." },
      { status: 500 },
    );
  }
}

async function fetchWikipediaKnowledge(
  name: string,
): Promise<{ text: string; source: string } | null> {
  try {
    const searchUrl = new URL("https://en.wikipedia.org/w/api.php");
    searchUrl.search = new URLSearchParams({
      action: "query",
      list: "search",
      srsearch: name,
      srlimit: "1",
      format: "json",
    }).toString();

    const headers = {
      "User-Agent": "TimelessTalk/1.0",
      Accept: "application/json",
    };
    const searchResponse = await fetch(searchUrl, { headers });
    if (!searchResponse.ok) {
      console.warn(
        `[Persona Ingestion] Wikipedia search returned HTTP ${searchResponse.status} for "${name}".`,
      );
      return null;
    }

    const searchResult = (await searchResponse.json()) as {
      query?: { search?: Array<{ title?: unknown }> };
    };
    const resolvedTitle = searchResult.query?.search?.[0]?.title;
    if (typeof resolvedTitle !== "string" || !resolvedTitle.trim()) {
      return null;
    }

    const extractUrl = new URL("https://en.wikipedia.org/w/api.php");
    extractUrl.search = new URLSearchParams({
      action: "query",
      prop: "extracts",
      explaintext: "true",
      exchars: "4000",
      redirects: "1",
      format: "json",
      titles: resolvedTitle,
    }).toString();

    const extractResponse = await fetch(extractUrl, { headers });
    if (!extractResponse.ok) {
      console.warn(
        `[Persona Ingestion] Wikipedia extract returned HTTP ${extractResponse.status} for "${resolvedTitle}".`,
      );
      return null;
    }

    const result = (await extractResponse.json()) as {
      query?: {
        pages?: Record<
          string,
          { title?: unknown; extract?: unknown; missing?: unknown }
        >;
      };
    };
    const article = Object.values(result.query?.pages ?? {}).find(
      (page) =>
        page.missing === undefined &&
        typeof page.title === "string" &&
        typeof page.extract === "string" &&
        page.extract.trim().length > 200,
    );

    if (!article || typeof article.title !== "string" || typeof article.extract !== "string") {
      return null;
    }

    return {
      text: article.extract.trim(),
      source: `Wikipedia: ${article.title}`,
    };
  } catch (error) {
    console.warn(
      `[Persona Ingestion] Could not search Wikipedia for "${name}".`,
      error,
    );
    return null;
  }
}

async function generatePersonaDetails(
  name: string,
  description?: string,
): Promise<{
  description: string;
  title: string;
  tagline: string;
  systemPrompt: string;
}> {
  const fallbackDescription =
    description ??
    `A thoughtful conversational persona inspired by ${name}. Use retrieved, verifiable knowledge to answer specific questions.`;
  const fallback = {
    description: fallbackDescription,
    title: name,
    tagline: description || `Explore ideas in conversation with ${name}.`,
    systemPrompt: `You are ${name}. ${fallbackDescription}

Respond thoughtfully and do not invent specific biographical claims. Use relevant
retrieved knowledge passages when available, and acknowledge uncertainty.`,
  };

  try {
    const { text } = await generateText({
      model: google("gemini-2.5-flash"),
      prompt: `Create a grounded AI persona profile from the information below.
${
  description
    ? "Use the supplied description as the basis for the profile."
    : "Use reliable public knowledge about the named person or character; do not invent unsupported biographical claims, and acknowledge uncertainty."
}
Return only a JSON object with string fields "description", "title", "tagline", and "systemPrompt".

Name: ${name}
${description ? `Description: ${description}` : ""}`,
    });

    const parsed = JSON.parse(text) as {
      description?: unknown;
      title?: unknown;
      tagline?: unknown;
      systemPrompt?: unknown;
    };

    if (
      typeof parsed.description !== "string" ||
      typeof parsed.title !== "string" ||
      typeof parsed.tagline !== "string" ||
      typeof parsed.systemPrompt !== "string" ||
      !parsed.description.trim() ||
      !parsed.title.trim() ||
      !parsed.tagline.trim() ||
      !parsed.systemPrompt.trim()
    ) {
      return fallback;
    }

    return {
      description: parsed.description.trim(),
      title: parsed.title.trim(),
      tagline: parsed.tagline.trim(),
      systemPrompt: parsed.systemPrompt.trim(),
    };
  } catch (error) {
    console.warn(
      "[Persona Creation] Gemini generation failed; using a safe fallback.",
      error,
    );
    return fallback;
  }
}

function chunkKnowledgeText(text: string): string[] {
  const cleanText = text.replace(/\s+/g, " ").trim();
  if (!cleanText) {
    return [];
  }

  const chunkSize = 500;
  const overlap = 50;
  const chunks: string[] = [];

  for (
    let start = 0;
    start < cleanText.length;
    start += chunkSize - overlap
  ) {
    chunks.push(cleanText.slice(start, start + chunkSize).trim());
  }

  return chunks.filter(Boolean);
}
