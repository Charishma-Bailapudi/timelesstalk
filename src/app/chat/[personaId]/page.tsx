import Link from "next/link";
import { redirect } from "next/navigation";
import { getPersonaById } from "@/lib/persona-store";

export default async function ChatPage({
  params,
}: {
  params: { personaId: string };
}) {
  const persona = await getPersonaById(params.personaId);

  if (!persona) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5">
        <div className="max-w-md text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-amber-300/80">
            Persona not found
          </p>
          <h1 className="text-3xl font-semibold text-stone-100">
            This voice is unknown.
          </h1>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-full border border-amber-300/30 px-5 py-2.5 text-sm font-semibold text-amber-200 transition hover:bg-amber-300/10"
          >
            Back to personas
          </Link>
        </div>
      </main>
    );
  }

  redirect(`/?persona=${encodeURIComponent(persona.id)}`);
}
