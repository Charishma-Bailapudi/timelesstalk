"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { getPersonaById } from "@/data/personas";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatPage({
  params,
}: {
  params: { personaId: string };
}) {
  const persona = getPersonaById(params.personaId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  if (!persona) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5">
        <div className="max-w-md text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-amber-300/80">
            Persona not found
          </p>
          <h1 className="text-3xl font-semibold text-stone-100">This voice is unknown.</h1>
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

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!persona) return;

    const message = input.trim();
    if (!message || isSending) return;

    setError("");
    setIsSending(true);
    setMessages((current) => [...current, { role: "user", content: message }]);
    setInput("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personaId: persona.id, message }),
      });
      const data = (await response.json()) as { reply?: string; error?: string };

      if (!response.ok || !data.reply) {
        throw new Error(data.error || "The message could not be sent.");
      }

      setMessages((current) => [
        ...current,
        { role: "assistant", content: data.reply as string },
      ]);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The message could not be sent.",
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col">
      <header className="border-b border-white/10 px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-4xl items-center gap-4">
          <Link
            href="/"
            className="text-sm font-medium text-stone-400 transition hover:text-amber-200"
          >
            ← Back
          </Link>
          <div className="ml-2">
            <h1 className="text-lg font-semibold text-stone-100">{persona.name}</h1>
            <p className="text-xs text-amber-200/70">{persona.title}</p>
          </div>
        </div>
      </header>

      <section
        aria-label="Message history"
        className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-5 py-6"
      >
        <div className="flex-1 space-y-4">
          {messages.length === 0 && (
            <p className="mx-auto max-w-md py-16 text-center text-stone-500">
              Begin a conversation with {persona.name}.
            </p>
          )}
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <p
                className={`max-w-[85%] rounded-2xl px-4 py-3 leading-7 sm:max-w-[70%] ${
                  message.role === "user"
                    ? "rounded-br-md bg-amber-300 text-stone-950"
                    : "rounded-bl-md border border-white/10 bg-white/[0.06] text-stone-200"
                }`}
              >
                {message.content}
              </p>
            </div>
          ))}
          {isSending && (
            <div className="flex justify-start">
              <p className="rounded-2xl rounded-bl-md border border-white/10 bg-white/[0.06] px-4 py-3 text-stone-400">
                {persona.name} is responding...
              </p>
            </div>
          )}
        </div>

        {error && (
          <p role="alert" className="mb-3 text-sm text-red-300">
            {error}
          </p>
        )}

        <form
          onSubmit={sendMessage}
          className="mt-6 flex gap-3 border-t border-white/10 pt-5"
        >
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={`Message ${persona.name}...`}
            aria-label="Chat message"
            className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/[0.05] px-5 py-3 text-stone-100 outline-none placeholder:text-stone-600 focus:border-amber-300/50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isSending}
            className="rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Send
          </button>
        </form>
      </section>
    </main>
  );
}
