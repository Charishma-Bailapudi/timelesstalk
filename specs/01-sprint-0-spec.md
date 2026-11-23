# Sprint 0 Specification — Scaffold & Echo Loop

## 1. Objective
Establish the foundational Next.js 14 App Router application with 3 static personas and a working frontend-to-backend echo chat loop. No AI models, streaming, databases, or authentication are included in this sprint.

## 2. Tech & Architectural Constraints
- **Framework:** Next.js 14 (App Router) with TypeScript and Tailwind CSS inside `src/`.
- **Rendering:** Use Server Components for static pages and Client Components (`"use client"`) only where interactive state is required (the chat interface).
- **Dependencies:** Do not install any AI SDKs, vector DB clients, Redis, or auth libraries in this sprint.

## 3. Required File Structure
- `src/data/personas.ts` — Static registry of the 3 initial personas.
- `src/app/page.tsx` — Homepage listing the 3 persona cards.
- `src/app/chat/[personaId]/page.tsx` — Dynamic chat interface for a selected persona.
- `src/app/api/chat/route.ts` — Backend Route Handler for chat messages.

## 4. Data Contract (`Persona`)
Each persona must contain:
- `id`: `"marcus"` | `"arjuna"` | `"bhishma"`
- `name`: Display name (Marcus Aurelius, Arjuna, Bhishma)
- `title`: Short historical/philosophical role
- `tagline`: One-sentence summary for the homepage card
- `systemPrompt`: Exact system prompt text copied from `specs/00-master-spec.md` (stored now for Sprint 1)

## 5. API Contract (`POST /api/chat`)
- **Request Body:** JSON object containing `personaId` (string) and `message` (non-empty string).
- **Success Response (`200 OK`):** JSON object containing `reply` formatted as `[<Persona Name> Echo]: <trimmed message>`.
- **Validation Error (`400 Bad Request`):** JSON object containing `error` message if `personaId` is unknown, `message` is empty/whitespace, or JSON is malformed.

## 6. UI/UX Requirements
- **Homepage (`/`):**
  - Clean, dark-themed layout with app title ("TimelessTalk") and brief subtitle.
  - Responsive 3-column grid displaying the 3 persona cards (name, title, tagline, and link to `/chat/[personaId]`).
- **Chat Page (`/chat/[personaId]`):**
  - Header showing a back link to `/`, the persona's name, and title.
  - Scrollable message history differentiating user messages (right-aligned) from assistant replies (left-aligned).
  - Input form with text box and Send button (disabled when input is empty or a request is in flight).
  - Graceful fallback UI with a "Back to personas" link if `personaId` does not exist.

## 7. Acceptance Criteria
- [ ] `GET /` renders all 3 persona cards (Marcus Aurelius, Arjuna, Bhishma).
- [ ] Clicking any card navigates to `/chat/[personaId]` with the correct persona header.
- [ ] Sending a message triggers `POST /api/chat` and renders both the user message and the `[<Persona Name> Echo]: <message>` response.
- [ ] Visiting `/chat/invalid-id` displays a clean fallback state without crashing.
- [ ] Sending an invalid `personaId` or empty `message` to `POST /api/chat` returns HTTP `400`.
- [ ] `npm run build` completes with zero TypeScript or ESLint errors.

## 8. Out of Scope
- Real LLM calls, streaming, RAG, Pinecone, Clerk, Redis, and custom persona creation.