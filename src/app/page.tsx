import { getAllPersonas } from "@/lib/persona-store";
import UnifiedChatWorkspace from "./UnifiedChatWorkspace";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams?: { persona?: string | string[] };
}) {
  const personas = await getAllPersonas();
  const selectedPersona = Array.isArray(searchParams?.persona)
    ? searchParams.persona[0]
    : searchParams?.persona;

  return (
    <UnifiedChatWorkspace
      personas={personas}
      initialPersonaId={selectedPersona}
    />
  );
}
