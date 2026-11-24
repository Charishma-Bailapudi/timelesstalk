"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { Persona } from "@/data/personas";
import { ChatMessage } from "@/lib/redis";

export default function ChatClient({
  persona,
  personaId,
}: {
  persona: Persona;
  personaId: string;
}) {
  const [input, setInput] = useState("");

  const { messages, sendMessage, status, error, clearError, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { personaId },
    }),
  });

  useEffect(() => {
    let active = true;

    async function restoreHistory() {
      try {
        const response = await fetch(
          `/api/chat/history?personaId=${encodeURIComponent(personaId)}`,
        );
        if (!response.ok) {
          return;
        }

        const result = (await response.json()) as {
          messages?: ChatMessage[];
        };
        if (active && Array.isArray(result.messages)) {
          setMessages(result.messages);
        }
      } catch (error) {
        console.warn("[Chat] Could not restore session history.", error);
      }
    }

    restoreHistory();
    return () => {
      active = false;
    };
  }, [personaId, setMessages]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = input.trim();
    if (!message || status === "submitted" || status === "streaming") return;

    clearError();
    setInput("");
    await sendMessage({ text: message });
  }

  const isLoading = status === "submitted" || status === "streaming";
  const accent =
    personaId === "marcus"
      ? "border-amber-300/30 bg-amber-300/10 text-amber-200"
      : personaId === "arjuna"
        ? "border-sky-300/30 bg-sky-300/10 text-sky-200"
        : personaId === "bhishma"
          ? "border-violet-300/30 bg-violet-300/10 text-violet-200"
          : "border-emerald-300/30 bg-emerald-300/10 text-emerald-200";

  async function clearChat() {
    try {
      await fetch(
        `/api/chat/history?personaId=${encodeURIComponent(personaId)}`,
        { method: "DELETE" },
      );
      setMessages([]);
    } catch (error) {
      console.warn("[Chat] Could not clear session history.", error);
    }
  }

  return (
    <main className="flex h-[calc(100vh-65px)] min-h-0 flex-col overflow-hidden">
      <header className="border-b border-white/10 px-4 py-3 sm:px-8 sm:py-4">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <Link
            href="/"
            className="text-sm font-medium text-stone-400 transition hover:text-amber-200"
          >
            ← Back
          </Link>
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${accent}`}
          >
            {persona.name.charAt(0)}
          </div>
          <div className="ml-1 min-w-0 flex-1">
            <h1 className="text-lg font-semibold text-stone-100">{persona.name}</h1>
            <p className="text-xs text-amber-200/70">{persona.title}</p>
          </div>
          <button
            type="button"
            onClick={clearChat}
            className="shrink-0 rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-stone-400 transition hover:border-red-300/30 hover:text-red-300 sm:px-4"
          >
            Clear Chat
          </button>
        </div>
      </header>

      <section
        aria-label="Message history"
        className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col px-4 py-4 sm:px-5 sm:py-6"
      >
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-end gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.role === "assistant" && (
                <div
                  className={`mb-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${accent}`}
                >
                  {persona.name.charAt(0)}
                </div>
              )}
              <p
                className={`max-w-[78%] whitespace-pre-wrap rounded-2xl px-3 py-3 leading-7 sm:max-w-[70%] sm:px-4 ${
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
            <div className="flex items-center justify-start gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold ${accent}`}
              >
                {persona.name.charAt(0)}
              </div>
              <div
                aria-label="Thinking"
                className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-white/10 bg-white/[0.06] px-4 py-4"
              >
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400 [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400 [animation-delay:300ms]" />
              </div>
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
