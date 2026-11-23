import { NextResponse } from "next/server";
import { getPersonaById } from "@/data/personas";

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

  const { personaId, message } = body as {
    personaId?: unknown;
    message?: unknown;
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

  if (typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json(
      { error: "Message must not be empty." },
      { status: 400 },
    );
  }

  const trimmedMessage = message.trim();
  return NextResponse.json({
    reply: `[${persona.name} Echo]: ${trimmedMessage}`,
  });
}
