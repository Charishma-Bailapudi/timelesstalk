import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/nextjs";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "TimelessTalk",
  description: "Converse with voices from history and philosophy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
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
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
