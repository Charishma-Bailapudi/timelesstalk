# Sprint 1 Specification — Streaming Chat (No RAG)

## 1. Objective
Replace the Sprint 0 echo backend with a real streaming LLM response powered by Google Gemini and the Vercel AI SDK. Each persona uses its hardcoded `systemPrompt` from `src/data/personas.ts`. No RAG, vector DB, auth, or caching yet.

## 2. Tech & Dependencies
- Install `ai` (Vercel AI SDK) and `@ai-sdk/google` (Google Gemini provider).
- Use `gemini-2.5-flash` via `@ai-sdk/google`.
- Read the API key from `GOOGLE_GENERATIVE_AI_API_KEY` in `.env.local`.

## 3. API Contract (`POST /api/chat`)
- **Request Body:** Standard Vercel AI SDK payload containing `messages` (conversation history) and `personaId` (string).
- **Behavior:**
  1. Validate that `personaId` exists in `PERSONAS`; return HTTP `400` if invalid.
  2. Call `streamText` from `ai` using `google("gemini-2.5-flash")`, the selected persona's `systemPrompt`, and the incoming `messages`.
  3. Return the streaming response compatible with `useChat`.
- **Error Handling:** Return clean JSON error with HTTP `400` for invalid `personaId` and HTTP `500` if the LLM call fails (never leak raw API keys).

## 4. Frontend Requirements (`src/app/chat/[personaId]/page.tsx`)
- Replace manual `fetch` and `messages` state with the Vercel AI SDK `useChat` hook configured to send `personaId` in the request body to `/api/chat`.
- Render incoming assistant tokens live as they stream in.
- Show a subtle "Thinking..." / loading indicator while waiting for the first token.
- Display a clean error banner if the API request fails (e.g., missing key or rate limit).
- Preserve the dark theme, persona header, back link, and invalid-persona fallback from Sprint 0.

## 5. Acceptance Criteria
- [ ] Asking Marcus Aurelius a question streams a Stoic response word-by-word in real time.
- [ ] Asking Arjuna the exact same question produces a noticeably different response reflecting his Kurukshetra dilemma.
- [ ] Multi-turn memory works within the active session (the persona remembers your previous message).
- [ ] Sending an invalid `personaId` to `POST /api/chat` still returns HTTP `400`.
- [ ] `.env.local` is NOT tracked by Git (`git status` must not show `.env.local`).
- [ ] `npm run build` succeeds with zero TypeScript or ESLint errors.

## 6. Out of Scope
- RAG, embeddings, Pinecone, LangChain, Clerk auth, Redis caching, and custom persona creation.