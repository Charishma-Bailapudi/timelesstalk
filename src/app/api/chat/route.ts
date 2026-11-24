import { getPersonaById } from "@/data/personas";
import { retrieveContext } from "@/lib/rag";
import { google } from "@ai-sdk/google";
import { convertToModelMessages, streamText } from "ai";
import { NextResponse } from "next/server";

function getLatestUserMessageText(messages: unknown[]): string {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (!message || typeof message !== "object") {
      continue;
    }

    const candidate = message as {
      role?: unknown;
      content?: unknown;
      parts?: unknown;
    };

    if (candidate.role !== "user") {
      continue;
    }

    if (typeof candidate.content === "string") {
      return candidate.content;
    }

    if (Array.isArray(candidate.parts)) {
      const text = candidate.parts
        .map((part) => {
          if (!part || typeof part !== "object") {
            return "";
          }
          const textPart = part as { type?: unknown; text?: unknown };
          return textPart.type === "text" && typeof textPart.text === "string"
            ? textPart.text
            : "";
        })
        .filter(Boolean)
        .join("\n");

      if (text) {
        return text;
      }
    }
  }

  return "";
}

export async function POST(request: Request) {
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

  const { personaId, messages } = body as {
    personaId?: unknown;
    messages?: unknown;
  };

  if (typeof personaId !== "string") {
    return NextResponse.json(
      { error: "A valid personaId is required." },
      { status: 400 },
    );
  }

  const persona = getPersonaById(personaId);
  if (!persona) {
    return NextResponse.json(
      { error: "Unknown personaId." },
      { status: 400 },
    );
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: "Messages must contain at least one message." },
      { status: 400 },
    );
  }

  try {
    const modelMessages = await convertToModelMessages(messages);
    let systemPrompt = persona.systemPrompt;

    if (personaId === "marcus") {
      const latestUserMessage = getLatestUserMessageText(messages);
      const passages = await retrieveContext(
        "marcus",
        latestUserMessage,
        3,
      );

      console.log(
        "[Marcus RAG] Retrieved passages:",
        passages.map((passage) => ({
          source: passage.source,
          score: passage.score,
          text: passage.text,
        })),
      );

      if (passages.length > 0) {
        const context = passages
          .map(
            (passage, index) =>
              `${index + 1}. (${passage.source}) ${passage.text}`,
          )
          .join("\n");

        systemPrompt = `${persona.systemPrompt}

Ground your response in the following passages from Meditations where relevant.
Use their ideas naturally and reflectively; do not quote mechanically or mention
retrieval, a knowledge base, or that passages were provided.

Retrieved passages:
${context}`;
      }
    }

    const result = streamText({
      model: google("gemini-2.5-flash"),
      system: systemPrompt,
      messages: modelMessages,
    });

    return result.toUIMessageStreamResponse();
  } catch {
    return NextResponse.json(
      { error: "The AI service could not process the request." },
      { status: 500 },
    );
  }
}
