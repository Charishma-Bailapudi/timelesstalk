import { NextResponse } from "next/server";

const VOICE_IDS: Record<string, string> = {
  marcus: "JBFqnCBsd6RMkjVDRZzb",
  arjuna: "IKne3meq5aSn9XLyUdCD",
  bhishma: "pqHfZKP75CvOlQylNhV4",
};
const DEFAULT_VOICE_ID = "nPczCjzI2devNBz1zQrb";

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
      { error: "A text and personaId are required." },
      { status: 400 },
    );
  }

  const { text, personaId } = body as {
    text?: unknown;
    personaId?: unknown;
  };
  if (
    typeof text !== "string" ||
    !text.trim() ||
    typeof personaId !== "string"
  ) {
    return NextResponse.json(
      { error: "A text and personaId are required." },
      { status: 400 },
    );
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Voice generation is unavailable." },
      { status: 503 },
    );
  }

  const cleanText = text
    .replace(/[*#`_~]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim()
    .slice(0, 1500);

  try {
    const voiceId = VOICE_IDS[personaId] || DEFAULT_VOICE_ID;
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: cleanText,
          model_id: "eleven_flash_v2_5",
        }),
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Voice generation is unavailable." },
        { status: 503 },
      );
    }

    return new Response(await response.arrayBuffer(), {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Voice generation is unavailable." },
      { status: 503 },
    );
  }
}
