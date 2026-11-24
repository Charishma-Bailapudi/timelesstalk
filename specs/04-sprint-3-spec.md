# Sprint 3 Specification — Clerk Auth + Custom Persona Creation

## 1. Objective
Add user authentication with Clerk and enable signed-in users to create their own custom AI personas with optional knowledge text that gets chunked, embedded, and stored in an isolated Pinecone namespace.

## 2. Tech & Dependencies
- Install `@clerk/nextjs` for authentication.
- Read `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` from `.env.local`.
- Continue using existing Gemini embeddings (768 dimensions) and Pinecone index (`timelesstalk`).

## 3. Authentication Requirements (Clerk)
- Wrap the app in `<ClerkProvider>` in `src/app/layout.tsx`.
- Add `src/middleware.ts` using `clerkMiddleware()` so auth state is available across routes.
- Add a clean top navigation bar with:
  - App brand link ("TimelessTalk" -> `/`)
  - "Create Persona" button/link (`/create`)
  - Clerk `<SignedOut>` (`<SignInButton />`) and `<SignedIn>` (`<UserButton />`) controls.
- The homepage (`/`) and chatting with the 3 default personas remain publicly accessible.
- `/create` and `POST /api/personas` require the user to be signed in (return HTTP `401` on the API if unauthenticated, and prompt sign-in on `/create`).

## 4. Custom Persona Storage (`src/lib/persona-store.ts`)
- Create a clean storage abstraction (`getAllPersonas()`, `getPersonaById(id)`, `saveCustomPersona(persona)`) that merges the 3 static default personas with user-created personas stored in a local JSON file (`data/custom-personas.json`, added to `.gitignore`).
- Each custom persona record includes: `id` (slug/UUID), `name`, `title`, `tagline`, `systemPrompt`, `createdBy` (Clerk `userId`), and `isCustom: true`.

## 5. Persona Creation API (`POST /api/personas`) & Ingestion
- **Request Body:** `{ name, title, corePrinciples, speakingStyle, knowledgeText? }`
- **Behavior:**
  1. Verify user is authenticated via Clerk `auth()`; return HTTP `401` if not.
  2. Validate required fields (`name`, `title`, `corePrinciples`, `speakingStyle`); return HTTP `400` if missing.
  3. Generate a structured `systemPrompt` from the form fields.
  4. Save the persona via `persona-store.ts`.
  5. If `knowledgeText` is provided and non-empty:
     - Split `knowledgeText` into clean chunks (~500 characters each with slight overlap).
     - Embed all chunks into 768-dimensional vectors using Gemini.
     - Upsert them into Pinecone under the isolated namespace matching the new persona's `id`.
  6. Return HTTP `201` with the created persona object.

## 6. Chat & Retrieval Updates
- Update `GET /` (Homepage) to display both the 3 default personas and any created custom personas.
- Update `/chat/[personaId]` and `POST /api/chat` to look up personas via `persona-store.ts` (supporting both default and custom personas).
- Update `POST /api/chat` so RAG retrieval (`retrieveContext(personaId, latestUserMessage, 3)`) runs for both `"marcus"` and any custom persona (failing gracefully if no vectors exist in that namespace).

## 7. Create Persona UI (`/create`)
- Clean dark-themed form matching the existing design with fields:
  - **Name** (e.g., "Steve Jobs")
  - **Title / Era** (e.g., "Co-founder of Apple")
  - **Core Principles** (textarea)
  - **Speaking Style** (textarea)
  - **Knowledge Base Text (Optional)** (textarea where users paste notes, quotes, or an article for RAG)
- Show a loading state ("Creating & indexing persona...") while submitting, and redirect to `/chat/<newPersonaId>` on success.

## 8. Acceptance Criteria
- [ ] Top navbar shows Sign In when logged out and User Profile button when logged in.
- [ ] Visiting `/create` while logged out prompts the user to sign in; `POST /api/personas` returns `401` when unauthenticated.
- [ ] A signed-in user can create a custom persona with pasted knowledge text and is redirected straight to `/chat/<newPersonaId>`.
- [ ] Chatting with the custom persona retrieves the top-k chunks from its dedicated Pinecone namespace (visible in server logs) and streams grounded responses.
- [ ] The new custom persona appears on the homepage (`/`) alongside Marcus Aurelius, Arjuna, and Bhishma.
- [ ] `npm run build` succeeds with zero TypeScript or ESLint errors.

## 9. Out of Scope
- Redis caching, LangChain refactoring, file uploads (PDF/DOCX), and editing/deleting personas.