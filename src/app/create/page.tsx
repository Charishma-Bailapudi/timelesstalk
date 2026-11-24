"use client";

import {
  SignedIn,
  SignedOut,
  SignInButton,
} from "@clerk/nextjs";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function CreatePersonaPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const form = new FormData(event.currentTarget);
    const body = {
      name: form.get("name"),
      title: form.get("title"),
      corePrinciples: form.get("corePrinciples"),
      speakingStyle: form.get("speakingStyle"),
      knowledgeText: form.get("knowledgeText"),
    };

    try {
      const response = await fetch("/api/personas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = (await response.json()) as {
        persona?: { id: string };
        error?: string;
      };

      if (!response.ok || !result.persona) {
        throw new Error(result.error || "The persona could not be created.");
      }

      router.push(`/chat/${result.persona.id}`);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "The persona could not be created.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen px-5 py-10 sm:px-8">
      <SignedOut>
        <div className="mx-auto max-w-lg rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center">
          <h1 className="text-2xl font-semibold text-stone-100">
            Sign in to create a persona
          </h1>
          <SignInButton mode="modal">
            <button className="mt-6 rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-stone-950">
              Sign In
            </button>
          </SignInButton>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="mx-auto max-w-2xl">
          <header className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-300/80">
              Custom persona
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-stone-100">
              Create a new voice
            </h1>
          </header>

          <form
            onSubmit={handleSubmit}
            className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.04] p-6 sm:p-8"
          >
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-300">
                Name
              </span>
              <input
                name="name"
                required
                placeholder="Steve Jobs"
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none focus:border-amber-300/50"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-300">
                Title / Era
              </span>
              <input
                name="title"
                required
                placeholder="Co-founder of Apple"
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none focus:border-amber-300/50"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-300">
                Core Principles
              </span>
              <textarea
                name="corePrinciples"
                required
                rows={5}
                placeholder="What beliefs guide this persona?"
                className="w-full resize-y rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none focus:border-amber-300/50"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-300">
                Speaking Style
              </span>
              <textarea
                name="speakingStyle"
                required
                rows={4}
                placeholder="How does this persona speak?"
                className="w-full resize-y rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none focus:border-amber-300/50"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-300">
                Knowledge Base Text (Optional)
              </span>
              <textarea
                name="knowledgeText"
                rows={8}
                placeholder="Paste notes, quotes, or an article..."
                className="w-full resize-y rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none focus:border-amber-300/50"
              />
            </label>

            {error && (
              <p role="alert" className="text-sm text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? "Creating & indexing persona..."
                : "Create Persona"}
            </button>
          </form>
        </div>
      </SignedIn>
    </main>
  );
}
