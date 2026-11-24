# Sprint 4 Specification — Upstash Redis Caching + UI Polish

## 1. Objective
Integrate Upstash Redis to cache active chat session history (with TTL) and persist custom persona metadata so the app is production-ready for serverless deployment on Vercel. Polish the UI with typing indicators, persona avatars, clear-chat functionality, and mobile responsiveness.

## 2. Tech & Dependencies
- Install `@upstash/redis`.
- Read `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` from `.env.local`.
- Keep the existing hand-rolled RAG pipeline (no LangChain refactor required).

## 3. Redis Client & Caching Layer (`src/lib/redis.ts`)
- Initialize a singleton Upstash Redis client using `Redis.fromEnv()`.
- Implement session history helpers:
  - Key format: `chat:<userId-or-guest>:<personaId>`
  - `getChatHistory(sessionKey)`: returns cached messages array (empty array if cache miss).
  - `saveChatHistory(sessionKey, messages)`: stores the last 20 messages in Redis with a **24-hour TTL** (`86400` seconds).
  - `clearChatHistory(sessionKey)`: deletes the Redis key.
- Fail gracefully (log warning and fall back to empty history) if Redis is unreachable.

## 4. Serverless-Ready Persona Store (`src/lib/persona-store.ts`)
- Upgrade `persona-store.ts` to store custom personas in Upstash Redis (e.g., under key `personas:custom`) instead of local JSON files, so custom personas persist cleanly on Vercel's read-only serverless filesystem.
- Continue merging the 3 default static personas (`marcus`, `arjuna`, `bhishma`) with custom personas from Redis.

## 5. API Updates
- **New Endpoint `GET /api/chat/history?personaId=<id>`:**
  - Uses Clerk `auth()` to identify the user (or falls back to `"guest"` for unauthenticated users).
  - Returns cached messages from Redis for that user + persona.
- **New Endpoint `DELETE /api/chat/history?personaId=<id>`:**
  - Clears the cached conversation history in Redis for that user + persona.
- **Update `POST /api/chat`:**
  - After streaming finishes (`onFinish` callback in `streamText`), save the updated conversation (user message + assistant reply) into Upstash Redis via `saveChatHistory`.

## 6. UI Polish Requirements
- **Session Restoration:** On `/chat/[personaId]`, fetch cached history from `GET /api/chat/history?personaId=...` on mount and hydrate `useChat` with those initial messages so refreshing the page preserves the chat.
- **Clear Chat Button:** Add a subtle "Clear Chat" button in the chat header that calls `DELETE /api/chat/history` and resets the UI message list.
- **Persona Avatars:** Display clean, stylized monogram/initial avatars with distinct accent colors for each persona on both homepage cards and chat messages.
- **Typing / Streaming Indicator:** Show an animated 3-dot "Thinking..." indicator while waiting for the first token from Gemini.
- **Mobile Responsiveness:** Ensure navbar, homepage persona grid, `/create` form, and chat input bar look clean and usable on mobile screen widths (375px+).

## 7. Acceptance Criteria
- [ ] Sending messages to Marcus Aurelius and refreshing the browser (`F5`) restores the exact conversation from Upstash Redis.
- [ ] Clicking "Clear Chat" wipes the messages in the UI and deletes the key from Redis (refreshing stays empty).
- [ ] Creating a custom persona stores it in Upstash Redis (not local JSON) and it remains visible on `/` after refresh.
- [ ] Persona avatars, animated typing indicator, and mobile layout render cleanly without overflow.
- [ ] `.env.local` is NOT tracked by Git (`git status` must not show `.env.local`).
- [ ] `npm run build` succeeds with zero TypeScript or ESLint errors.

## 8. Out of Scope
- LangChain refactoring, voice I/O, multi-persona group chats, and Vercel production deployment (Sprint 5).