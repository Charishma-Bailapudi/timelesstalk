"use client";

import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import { Persona } from "@/data/personas";
import { stopSpeaking } from "@/lib/voice";
import Link from "next/link";
import { useState } from "react";
import ChatClient from "./chat/[personaId]/ChatClient";

interface UnifiedChatWorkspaceProps {
  personas: Persona[];
  initialPersonaId?: string;
}

export default function UnifiedChatWorkspace({
  personas: initialPersonas,
  initialPersonaId,
}: UnifiedChatWorkspaceProps) {
  const [personas, setPersonas] = useState(initialPersonas);
  const [activePersonaId, setActivePersonaId] = useState(() =>
    initialPersonas.some((persona) => persona.id === initialPersonaId)
      ? initialPersonaId!
      : "marcus",
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deletingPersonaId, setDeletingPersonaId] = useState<string | null>(
    null,
  );
  const [deleteError, setDeleteError] = useState("");
  const activePersona =
    personas.find((persona) => persona.id === activePersonaId) ??
    personas.find((persona) => persona.id === "marcus");

  function selectPersona(personaId: string) {
    stopSpeaking();
    setActivePersonaId(personaId);
    setDrawerOpen(false);
    window.history.replaceState(
      null,
      "",
      `/?persona=${encodeURIComponent(personaId)}`,
    );
  }

  async function deletePersona(personaId: string) {
    setDeleteError("");
    setDeletingPersonaId(personaId);

    try {
      const response = await fetch(
        `/api/personas?id=${encodeURIComponent(personaId)}`,
        { method: "DELETE" },
      );
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error || "Could not delete the persona.");
      }

      setPersonas((current) =>
        current.filter((persona) => persona.id !== personaId),
      );
      if (activePersonaId === personaId) {
        stopSpeaking();
        setActivePersonaId("marcus");
        window.history.replaceState(null, "", "/?persona=marcus");
      }
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "Could not delete the persona.",
      );
    } finally {
      setDeletingPersonaId(null);
    }
  }

  if (!activePersona) {
    return null;
  }

  return (
    <main className="flex h-dvh min-h-0 overflow-hidden bg-[#121210]">
      <SidebarContent
        personas={personas}
        activePersonaId={activePersonaId}
        deletingPersonaId={deletingPersonaId}
        deleteError={deleteError}
        onSelect={selectPersona}
        onDelete={deletePersona}
        className="hidden h-full w-[260px] shrink-0 border-r border-white/10 md:flex"
      />

      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close persona menu"
            className="absolute inset-0 bg-black/65"
            onClick={() => setDrawerOpen(false)}
          />
          <SidebarContent
            personas={personas}
            activePersonaId={activePersonaId}
            deletingPersonaId={deletingPersonaId}
            deleteError={deleteError}
            onSelect={selectPersona}
            onDelete={deletePersona}
            className="relative flex h-full w-[min(82vw,300px)] border-r border-white/10 shadow-2xl"
          />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <ChatClient
          key={activePersona.id}
          persona={activePersona}
          personaId={activePersona.id}
          workspace
          onMenuClick={() => setDrawerOpen(true)}
        />
      </div>
    </main>
  );
}

function SidebarContent({
  personas,
  activePersonaId,
  deletingPersonaId,
  deleteError,
  onSelect,
  onDelete,
  className,
}: {
  personas: Persona[];
  activePersonaId: string;
  deletingPersonaId: string | null;
  deleteError: string;
  onSelect: (personaId: string) => void;
  onDelete: (personaId: string) => void;
  className: string;
}) {
  const { user, isLoaded } = useUser();

  return (
    <aside className={`flex-col bg-[#171715] px-3 py-4 ${className}`}>
      <Link href="/" className="mb-5 px-2 text-lg font-semibold text-stone-100">
        TimelessTalk
      </Link>
      <Link
        href="/create"
        className="mb-6 flex h-11 items-center justify-center rounded-xl bg-amber-300 text-sm font-semibold text-stone-950 transition hover:bg-amber-200"
      >
        + Create Persona
      </Link>

      <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
        Personas
      </p>
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
        {personas.map((persona) => {
          const canDelete =
            persona.isCustom &&
            isLoaded &&
            user?.id === persona.createdBy;

          return (
            <div
              key={persona.id}
              className={`group flex items-center rounded-xl pr-2 transition ${
                activePersonaId === persona.id
                  ? "bg-white/[0.09]"
                  : "hover:bg-white/[0.05]"
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect(persona.id)}
                aria-current={activePersonaId === persona.id ? "page" : undefined}
                className="flex min-w-0 flex-1 items-center gap-3 px-2 py-2.5 text-left"
              >
                <PersonaAvatar persona={persona} />
                <span className="truncate text-sm font-medium text-stone-200">
                  {persona.name}
                </span>
              </button>
              {canDelete && (
                <button
                  type="button"
                  aria-label={`Delete ${persona.name}`}
                  disabled={deletingPersonaId === persona.id}
                  onClick={() => onDelete(persona.id)}
                  className="rounded-md p-1.5 text-stone-500 opacity-0 transition hover:bg-red-400/10 hover:text-red-300 focus:opacity-100 group-hover:opacity-100 disabled:opacity-50"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 20 20"
                    fill="none"
                    className="h-4 w-4"
                  >
                    <path
                      d="M3.5 5.5h13m-11.5 0 .7 11h7.6l.7-11m-7.5 0V3.8h5V5.5m-3.5 3v5m2-5v5"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {deleteError && (
        <p role="alert" className="mt-2 px-2 text-xs text-red-300">
          {deleteError}
        </p>
      )}

      <div className="mt-4 flex min-h-10 items-center border-t border-white/10 px-2 pt-3">
        <SignedIn>
          <UserButton />
        </SignedIn>
        <SignedOut>
          <SignInButton mode="modal">
            <button className="text-sm font-medium text-stone-400 hover:text-amber-200">
              Sign in
            </button>
          </SignInButton>
        </SignedOut>
      </div>
    </aside>
  );
}

function PersonaAvatar({ persona }: { persona: Persona }) {
  const accent =
    persona.id === "marcus"
      ? "border-amber-300/30 bg-amber-300/10 text-amber-200"
      : persona.id === "arjuna"
        ? "border-sky-300/30 bg-sky-300/10 text-sky-200"
        : persona.id === "bhishma"
          ? "border-violet-300/30 bg-violet-300/10 text-violet-200"
          : "border-emerald-300/30 bg-emerald-300/10 text-emerald-200";

  return (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${accent}`}
    >
      {persona.name.charAt(0)}
    </span>
  );
}
