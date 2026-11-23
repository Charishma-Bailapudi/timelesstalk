import { getPersonaById } from "@/data/personas";
import { google } from "@ai-sdk/google";
import { convertToModelMessages, streamText } from "ai";
import { NextResponse } from "next/server";

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
    const result = streamText({
      model: google("gemini-2.5-flash"),
      system: persona.systemPrompt,
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
