"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { Persona } from "@/data/personas";

export default function ChatClient({
  persona,
  personaId,
}: {
  persona: Persona;
  personaId: string;
}) {
  const [input, setInput] = useState("");

  const { messages, sendMessage, status, error, clearError } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { personaId },
    }),
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = input.trim();
    if (!message || status === "submitted" || status === "streaming") return;

    clearError();
    setInput("");
    await sendMessage({ text: message });
  }

  const isLoading = status === "submitted" || status === "streaming";

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

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <p
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 leading-7 sm:max-w-[70%] ${
                  message.role === "user"
                    ? "rounded-br-md bg-amber-300 text-stone-950"
                    : "rounded-bl-md border border-white/10 bg-white/[0.06] text-stone-200"
                }`}
              >
                {message.parts
                  .filter((part) => part.type === "text")
                  .map((part) => part.text)
                  .join("")}
              </p>
            </div>
          ))}

          {status === "submitted" && (
            <div className="flex justify-start">
              <p className="rounded-2xl rounded-bl-md border border-white/10 bg-white/[0.06] px-4 py-3 text-stone-400">
                Thinking...
              </p>
            </div>
          )}
        </div>

        {error && (
          <p role="alert" className="mb-3 text-sm text-red-300">
            {error.message || "The message could not be sent."}
          </p>
        )}

        <form
          onSubmit={handleSubmit}
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
            disabled={!input.trim() || isLoading}
            className="rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Send
          </button>
        </form>
      </section>
    </main>
  );
}
