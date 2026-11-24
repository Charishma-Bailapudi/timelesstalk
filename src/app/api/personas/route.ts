import { auth } from "@clerk/nextjs/server";
import { google } from "@ai-sdk/google";
import { Pinecone } from "@pinecone-database/pinecone";
import { embedMany } from "ai";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { saveCustomPersona } from "@/lib/persona-store";
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

  const {
    name,
    title,
    corePrinciples,
    speakingStyle,
    knowledgeText,
  } = body as {
    name?: unknown;
    title?: unknown;
    corePrinciples?: unknown;
    speakingStyle?: unknown;
    knowledgeText?: unknown;
  };

  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof title !== "string" ||
    !title.trim() ||
    typeof corePrinciples !== "string" ||
    !corePrinciples.trim() ||
    typeof speakingStyle !== "string" ||
    !speakingStyle.trim()
  ) {
    return NextResponse.json(
      {
        error:
          "Name, title, core principles, and speaking style are required.",
      },
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

  const systemPrompt = `You are ${name.trim()}, ${title.trim()}.

Core principles:
${corePrinciples.trim()}

Speaking style:
${speakingStyle.trim()}

Respond consistently as this persona. Apply the core principles and speaking style
naturally, while grounding claims in the retrieved knowledge passages when relevant.
Do not claim that you searched a database or received passages.`;

  const persona: Persona = {
    id,
    name: name.trim(),
    title: title.trim(),
    tagline: `${name.trim()} — ${title.trim()}`,
    systemPrompt,
    createdBy: userId,
    isCustom: true,
  };

  await saveCustomPersona(persona);

  if (typeof knowledgeText === "string" && knowledgeText.trim()) {
    try {
      if (!process.env.PINECONE_API_KEY) {
        throw new Error("PINECONE_API_KEY is missing.");
      }

      const chunks = chunkKnowledgeText(knowledgeText);
      if (chunks.length > 0) {
        const { embeddings } = await embedMany({
          model: google.embedding("gemini-embedding-001"),
          values: chunks,
          dimensions: 768,
        });

        if (embeddings.some((embedding) => embedding.length !== 768)) {
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
              source: `${name.trim()} knowledge base`,
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
  }

  return NextResponse.json({ persona }, { status: 201 });
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
