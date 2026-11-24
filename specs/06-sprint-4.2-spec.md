Implement Sprint 4.8 of TimelessTalk: 10 seeded built-in personas + dynamic Wikipedia Search-First RAG + instant "Summon Anyone" creation.

Instructions:
1. **Expand Built-in Personas (`src/data/personas.ts` & `src/app/api/voice/route.ts`):**
   - Include 10 built-in personas: `marcus` (Marcus Aurelius), `arjuna` (Arjuna), `bhishma` (Bhishma), `chanakya` (Chanakya), `vivekananda` (Swami Vivekananda), `kalam` (A. P. J. Abdul Kalam), `socrates` (Socrates), `tesla` (Nikola Tesla), `cleopatra` (Cleopatra), and `davinci` (Leonardo da Vinci).
   - Map all 10 IDs to distinct ElevenLabs preset voices in `src/app/api/voice/route.ts` (use a female preset voice like `EXAVITQu4vr4xnSDxMaL` for `cleopatra`).

2. **Seed All 10 Personas (`scripts/seed-all.ts`):**
   - Create `scripts/seed-all.ts` (and add `"seed:all": "tsx scripts/seed-all.ts"` to `package.json`) with 6–8 authentic passages per persona (~60–80 passages total).
   - Ensure the `timelesstalk` Pinecone index (768 dimensions, cosine) exists, embed each persona's passages with Gemini (`embedMany`), and upsert them into their matching Pinecone namespace (`"marcus"`, `"arjuna"`, etc.).

3. **Dynamic Wikipedia Search-First RAG (`POST /api/personas`):**
   - Make `description` optional in `POST /api/personas` (if omitted, auto-generate `description`, `title`, `tagline`, and `systemPrompt` from `name` alone using Gemini `generateText`).
   - When `knowledgeText` is empty:
     a. Call Wikipedia Search API (`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=<encodedName>&srlimit=1&format=json`) with `User-Agent: TimelessTalk/1.0` to resolve fuzzy/fictional names (e.g., `"spider man"` -> `"Spider-Man"`, `"tony stark"` -> `"Iron Man"`).
     b. If a search hit exists, fetch its plain-text extract (`action=query&prop=extracts&explaintext=true&exchars=4000&redirects=1&format=json&titles=<resolvedTitle>`), chunk it (~500 chars with overlap), generate 768-dim Gemini embeddings, and upsert into the persona's Pinecone namespace.
     c. If no Wikipedia match exists (e.g., `"Phani"`), fail gracefully without error and save the persona with an empty namespace.

4. **Instant "Summon Anyone" Input in Sidebar (`src/app/page.tsx`):**
   - At the top of the left sidebar, add a compact input box (`placeholder="Summon anyone (e.g. Iron Man)..."`) with a submit button that calls `POST /api/personas` with `{ name }`, shows a brief loading state ("Summoning & indexing..."), adds the persona to the sidebar, and switches directly to their chat.
   - Keep a secondary `+ Custom Persona (with notes)` link to `/create` for private personas like friends where the user wants to paste custom text.

5. Run `npm run build` to verify zero TypeScript or lint errors.