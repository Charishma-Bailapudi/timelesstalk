"use client";

import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AppNavigation() {
  const pathname = usePathname();

  if (pathname === "/") {
    return null;
  }

  return (
    <nav className="border-b border-white/10 px-4 py-3 sm:px-8 sm:py-4">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/" className="text-lg font-semibold text-stone-100">
          TimelessTalk
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/create"
            className="rounded-full border border-amber-300/30 px-4 py-2 text-sm font-semibold text-amber-200 transition hover:bg-amber-300/10"
          >
            Create Persona
          </Link>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="rounded-full bg-amber-300 px-4 py-2 text-sm font-semibold text-stone-950">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </div>
    </nav>
  );
}
