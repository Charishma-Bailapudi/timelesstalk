import Link from "next/link";
import { personas } from "@/data/personas";

export default function Home() {
  return (
    <main className="min-h-screen px-5 py-12 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-amber-300/80">
            Timeless conversations
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-stone-50 sm:text-5xl">
            TimelessTalk
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-stone-400">
            Converse with remarkable voices from history and philosophy.
          </p>
        </header>

        <section aria-label="Available personas" className="grid gap-5 md:grid-cols-3">
          {personas.map((persona) => (
            <Link
              key={persona.id}
              href={`/chat/${persona.id}`}
              className="group rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition hover:-translate-y-1 hover:border-amber-300/40 hover:bg-white/[0.07]"
            >
              <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-full border border-amber-300/30 bg-amber-300/10 text-lg font-semibold text-amber-200">
                {persona.name.charAt(0)}
              </div>
              <h2 className="text-xl font-semibold text-stone-100">{persona.name}</h2>
              <p className="mt-1 text-sm font-medium text-amber-200/80">{persona.title}</p>
              <p className="mt-4 leading-7 text-stone-400">{persona.tagline}</p>
              <span className="mt-6 inline-flex text-sm font-semibold text-amber-300">
                Start a conversation
                <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
              </span>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
