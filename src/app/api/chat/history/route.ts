import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { clearChatHistory, getChatHistory } from "@/lib/redis";

async function getOwnerId() {
  const { userId } = await auth();
  return userId || "guest";
}

function getSessionKey(personaId: string, ownerId: string) {
  return `chat:${ownerId}:${personaId}`;
}

export async function GET(request: NextRequest) {
  const personaId = request.nextUrl.searchParams.get("personaId");
  if (!personaId) {
    return NextResponse.json(
      { error: "personaId is required." },
      { status: 400 },
    );
  }

  const ownerId = await getOwnerId();
  const messages = await getChatHistory(
    getSessionKey(personaId, ownerId),
  );

  return NextResponse.json({ messages });
}

export async function DELETE(request: NextRequest) {
  const personaId = request.nextUrl.searchParams.get("personaId");
  if (!personaId) {
    return NextResponse.json(
      { error: "personaId is required." },
      { status: 400 },
    );
  }

  const ownerId = await getOwnerId();
  await clearChatHistory(getSessionKey(personaId, ownerId));

  return NextResponse.json({ cleared: true });
}
