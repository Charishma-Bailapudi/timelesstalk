# Sprint 4.5 Specification — Simplified Create Form + ElevenLabs Cinematic Voices

## 1. Objective
1. Simplify `/create` from 5 form fields down to 2 core fields (plus a collapsible optional Knowledge Base toggle).
2. Add realistic, cinematic human voice playback for AI responses using the ElevenLabs Text-to-Speech API (`eleven_flash_v2_5`) with distinct preset voices per persona and an automatic browser Web Speech API fallback.

## 2. Simplified Create Persona Flow (`/create` & `POST /api/personas`)
- **UI (`/create`):**
  - Replace the 5-box form with **2 required fields**:
    1. **Name** (text input, e.g., `"Steve Jobs"`)
    2. **Who are they? (1–2 sentences)** (textarea, e.g., `"Co-founder of Apple. Direct, minimalist, obsessed with product craft."`)
  - Add a collapsible toggle button: **"+ Add custom notes or quotes (Optional)"** that reveals the `knowledgeText` textarea only when clicked.
- **Backend (`POST /api/personas`):**
  - Accept `{ name, description, knowledgeText? }`; return HTTP `400` if `name` or `description` is missing.
  - Use `generateText` with `google("gemini-2.5-flash")` to auto-generate `title`, `tagline`, and `systemPrompt` (with a safe template fallback if generation fails).
  - Keep existing Clerk `auth()` check, Upstash Redis storage, and Pinecone namespace ingestion unchanged.

## 3. ElevenLabs Voice API (`POST /api/voice`)
- **Auth & Secret:** Read `ELEVENLABS_API_KEY` from `.env.local` on the server only (never expose to client).
- **Request Body:** `{ text: string, personaId: string }`
- **Voice Mapping (ElevenLabs Default Preset Voice IDs):**
  - `marcus`: Deep, calm, authoritative narrator voice (e.g., George — `JBFqnCBsd6RMkjVDRZzb`)
  - `arjuna`: Clear, expressive, resolute voice (e.g., Charlie — `IKne3meq5aSn9XLyUdCD`)
  - `bhishma`: Grave, wise, elder voice (e.g., Bill — `pqHfZKP75CvOlQylNhV4`)
  - Custom personas / fallback: Warm, clear default voice (e.g., Brian — `nPczCjzI2devNBz1zQrb`)
- **Behavior:**
  1. Strip markdown formatting (`*`, `#`, `` ` ``) from `text` and cap length safely (e.g., 1,500 chars) to protect free-tier credits.
  2. Call ElevenLabs REST API (`POST https://api.elevenlabs.io/v1/text-to-speech/{voiceId}`) using header `xi-api-key: ELEVENLABS_API_KEY`, `model_id: "eleven_flash_v2_5"`, and `output_format: "mp3_44100_128"`.
  3. Return the raw MP3 audio stream with `Content-Type: audio/mpeg`.
  4. If `ELEVENLABS_API_KEY` is missing or ElevenLabs returns an error/quota limit, return a clean JSON error (HTTP `503`) so the frontend can gracefully fall back to Web Speech API.

## 4. Client Voice Helper (`src/lib/voice.ts`) & Chat UI
- Create `src/lib/voice.ts`:
  - `speakText(text, personaId, onEnd)`: calls `POST /api/voice`, creates an `Audio` object from the returned MP3 blob, and plays it.
  - **Graceful Fallback:** If `/api/voice` fails (e.g., missing key or quota exceeded), automatically fall back to `window.speechSynthesis` so the Listen button never breaks.
  - `stopSpeaking()`: pauses/resets any active `Audio` element and cancels `window.speechSynthesis`.
- **Chat UI (`src/app/chat/[personaId]/page.tsx`):**
  - Add a **🔊 Listen** / **⏳ Loading...** / **⏹ Stop** button on each assistant message bubble.
  - Keep **Auto-Speak** OFF by default (with an optional toggle in the header) so free-tier ElevenLabs credits are only spent when the user chooses to listen.
  - Automatically call `stopSpeaking()` when navigating away, clearing chat, or sending a new message.

## 5. Acceptance Criteria
- [ ] `/create` shows only 2 input boxes by default, with the Knowledge Base textarea hidden behind an optional toggle.
- [ ] Clicking **🔊 Listen** on a Marcus Aurelius, Arjuna, or Bhishma reply plays a distinct, realistic ElevenLabs MP3 voice.
- [ ] Clicking **⏹ Stop** halts audio immediately.
- [ ] If ElevenLabs is unavailable or out of credits, it silently falls back to browser speech without crashing.
- [ ] `ELEVENLABS_API_KEY` is never exposed in client-side code or tracked by Git.
- [ ] `npm run build` succeeds with zero TypeScript or ESLint errors.