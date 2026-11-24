# Sprint 2 Specification — Hand-Rolled RAG (No LangChain)

## 1. Objective
Implement an end-to-end Retrieval-Augmented Generation (RAG) pipeline by hand for Marcus Aurelius using Google Gemini embeddings and Pinecone. No LangChain, auth, or Redis yet.

## 2. Tech & Dependencies
- Install `@pinecone-database/pinecone` for vector storage and retrieval.
- Install `tsx` and `dotenv` as dev dependencies to run a standalone TypeScript seeding script.
- Use Vercel AI SDK's `embed` / `embedMany` with `@ai-sdk/google` embedding model configured for 768-dimensional vectors.
- Read `GOOGLE_GENERATIVE_AI_API_KEY`, `PINECONE_API_KEY`, and `PINECONE_INDEX_NAME` from `.env.local`.

## 3. Data Seeding & Auto-Index Setup (`scripts/seed-marcus.ts`)
- Load environment variables from `.env.local` using `dotenv`.
- **Automatic Index Provisioning:** Before upserting, check if the index named `PINECONE_INDEX_NAME` (`timelesstalk`) exists in Pinecone. If it does not exist, create it programmatically as a **Serverless** index on **AWS `us-east-1`** with **`768` dimensions** and **`cosine` metric**, and wait until the index is ready.
- Include 10–15 curated, authentic passages from Marcus Aurelius's *Meditations* covering themes like control, anger, impermanence, duty, judgment, and resilience.
- Each passage must have an `id`, `text`, and `source` (e.g., `"Meditations, Book 4"`).
- Embed all passages into 768-dimensional vectors and upsert them into Pinecone under the namespace `"marcus"`, storing `text` and `source` in each vector's metadata.
- Add an npm script `"seed:marcus": "tsx scripts/seed-marcus.ts"` to `package.json`.

## 4. Retrieval Helper (`src/lib/rag.ts`)
- Create a reusable function `retrieveContext(personaId: string, query: string, topK = 3)`:
  1. Generates a 768-dimensional embedding vector for `query`.
  2. Queries the Pinecone index in the namespace matching `personaId` for the `topK` closest matches.
  3. Returns an array of matched passages (`text`, `source`, `score`).
  4. Fails gracefully (returns an empty array and logs a warning) if the index/namespace has no records yet (e.g., Arjuna or Bhishma).

## 5. API Contract Update (`POST /api/chat`)
- Extract the latest user message text from `messages`.
- If `personaId === "marcus"`, call `retrieveContext("marcus", latestUserMessage, 3)`.
- Log the retrieved passages and their similarity scores to the server console so retrieval can be inspected during development.
- Inject the retrieved passages into the `system` prompt before calling `streamText`, instructing Marcus Aurelius to ground his reasoning naturally in those passages without sounding robotic.
- Arjuna and Bhishma continue working normally with their base system prompts.

## 6. Acceptance Criteria
- [ ] Running `npm run seed:marcus` automatically creates the `timelesstalk` index (if missing) and upserts all *Meditations* passages into the `"marcus"` namespace without errors.
- [ ] Asking Marcus Aurelius a question about anger, control, or fear logs the top 3 retrieved *Meditations* passages and their similarity scores in the VS Code terminal.
- [ ] Marcus Aurelius's streamed response reflects the ideas from the retrieved passages.
- [ ] Chatting with Arjuna or Bhishma still works smoothly without crashing.
- [ ] `.env.local` is NOT tracked by Git (`git status` must not show `.env.local`).
- [ ] `npm run build` succeeds with zero TypeScript or ESLint errors.

## 7. Out of Scope
- LangChain, Clerk auth, Redis caching, custom persona creation, and UI source badges (UI polish comes in Sprint 4).