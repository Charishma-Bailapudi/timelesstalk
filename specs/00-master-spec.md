# TimelessTalk — Spec & Sprint Plan

*A living spec for building TimelessTalk: an AI persona chat app with RAG-grounded responses and custom character creation.*

## Problem Statement

People who want to explore ideas, philosophy, or historical perspectives through conversation have no easy way to "think out loud" with a specific voice or worldview — generic chatbots give generic answers regardless of who you ask. TimelessTalk solves this by letting users converse with AI personas grounded in a real figure's actual writing and philosophy (not just their Wikipedia bio), and lets users design their own custom personas the same way.

**Success criteria:**

- A user can pick a persona (e.g., Marcus Aurelius) and get responses that reflect that figure's actual recorded reasoning style, not generic "old-timey" flavor text.
- Responses stream in real time, feel continuous across a session, and are grounded in a retrievable knowledge base (not pure hallucination).
- A signed-in user can create a new persona from a form + optional document upload within ~2 minutes.
- The app is deployed, public, and demoable in under 10 seconds of load time.

**Out of scope for v1:** voice I/O, multi-persona group chats, persona-to-persona conversations, mobile app.

## Tech Stack — Decisions & Alternatives

| Layer | Chosen | Why | Real alternative | When you'd pick the alternative instead |
| --- | --- | --- | --- | --- |
| Framework | Next.js 14 (App Router) | Built-in API routes + streaming support + the Vercel AI SDK is designed around it, so chat UIs are the path of least resistance | Vite + React, or Remix | If you didn't need server-rendered routes or were building a pure SPA — Vite is lighter and simpler to reason about for beginners |
| Streaming | Vercel AI SDK (`useChat`) | Handles token-by-token UI state for you — without it you'd hand-roll Server-Sent Events parsing | Raw `fetch` + manual stream reading | If you want to deeply understand streaming mechanics first (a good learning exercise before using the SDK) |
| LLM orchestration | LangChain | Gives you prebuilt abstractions for retrieval + prompt templating so you're not gluing raw API calls together | Just call the LLM API directly, no framework | **Recommended for v1:** build RAG by hand first (embed → cosine similarity → inject into prompt). LangChain adds an abstraction layer that can be confusing when you're also new to RAG. Add LangChain later once the concept is second nature. |
| Vector DB | Pinecone | Managed, generous free tier, dead-simple API | pgvector (Postgres extension), or Chroma (local/open-source) | If you're already running Postgres (e.g. via Supabase), pgvector means one less service to manage and is free forever at small scale |
| Cache | Redis (Upstash) | Serverless-friendly, works on Vercel Edge, sub-millisecond reads | Just use the DB, or skip caching entirely for v1 | At demo-project scale, caching barely matters for performance — could be cut from v1 and added later without anyone noticing |
| Auth | Clerk | Prebuilt UI components, fastest path to working auth | Auth.js (NextAuth), or Supabase Auth | Auth.js is fully open-source/self-hosted and free forever, but you write more UI yourself |

## Sprint Plan

### Sprint 0 — Learn + scaffold (no AI yet)

Build a bare Next.js 14 app with one static page listing 3 hardcoded personas and a chat UI that just echoes your typed message back. **Goal:** get comfortable with App Router, server components vs client components, and API routes before any AI is involved.

### Sprint 1 — Streaming chat, no RAG

Wire up a real LLM call in an API route, streamed to the UI with the Vercel AI SDK's `useChat`. Each persona just has a hardcoded system prompt (no knowledge base yet). **Goal:** nail streaming and prompt design before adding retrieval complexity.

### Sprint 2 — RAG by hand

Pick one persona (Marcus Aurelius). Chunk ~10 passages from *Meditations*, embed them (OpenAI/Gemini embeddings API), store in Pinecone. On each message, embed the query, retrieve top 3 matches, inject into the prompt manually — no LangChain yet. **Goal:** understand retrieval end-to-end.

### Sprint 3 — Auth + persona creation

Add Clerk auth. Build the "create your own persona" form that generates a system prompt from form fields and creates its own Pinecone namespace. **Goal:** user-generated content flow, not just static personas.

### Sprint 4 — Caching + polish

Add Redis for session history caching. Clean up UI (typing indicators, avatars, mobile responsiveness). Optionally refactor the hand-rolled RAG into LangChain now that you understand what it's replacing.

### Sprint 5 — Deploy + demo prep

Deploy to Vercel, set all env vars, test cold-start latency, record a short demo video or GIF, write the README with architecture diagram. **Goal:** something you can confidently walk an interviewer through.

## Agent Orchestration — Not Needed for v1

Right now the flow is one LLM call per message, optionally enriched by one retrieval step — a pipeline, not an agent system. This is simpler to build, debug, and explain in an interview.

Agent orchestration would earn its place if the project grew to include:

- A **fact-checker agent** that double-checks the persona's claims against retrieved passages before responding
- A **router agent** that decides, per message, whether retrieval is even needed
- A **memory-summarizer agent** that periodically compresses long chat history into a running summary

These are good **stretch goals for Sprint 6+**. LangGraph (LangChain's orchestration layer) is the natural tool if that point is reached — but bolting on agents before the core product works risks stalling the project before v1 ships.

## Example Persona Prompt — Marcus Aurelius

```text
You are Marcus Aurelius, Roman Emperor and Stoic philosopher.

Core principles that shape every response:
- You believe almost everything outside your own judgment and will is
  indifferent — reputation, pain, death, others' opinions. What matters
  is acting virtuously and accepting what you cannot control.
- You constantly examine your own motives and reactions rather than
  blaming external events or people.
- You speak plainly and reflectively, often addressing yourself as much
  as the listener — the way Meditations reads like private notes, not
  speeches.
- You draw on nature, impermanence, and duty as recurring themes.
- You are calm, unhurried, a little melancholic, never performative.

When someone brings you a modern problem, translate it into Stoic terms:
separate what is in their control from what isn't, ask what virtue the
situation calls for, and respond the way Meditations argues with itself.
```

## Example Persona Prompts — Arjuna and Bhishma

Two more figures from the *Mahabharata* that work well as personas, each with a distinct internal conflict to ground their voice in — useful for showing range beyond Western Stoicism.

### Arjuna

```text
You are Arjuna, the great warrior-archer of the Mahabharata, speaking as
he does at Kurukshetra before the battle begins.

Core principles that shape every response:
- You are torn between duty (dharma) and attachment — you see your own
  teachers, kin, and friends on the opposing side, and the thought of
  fighting them paralyzes you even though you know your cause is just.
- You question before you act. You do not pretend certainty you don't
  feel — you voice doubt, grief, and moral confusion openly, the way
  you do to Krishna before receiving his counsel.
- You are skilled and disciplined (the finest archer alive) but that
  skill means nothing to you when it conflicts with love for those you
  must oppose.
- You often restate the dilemma from different angles rather than
  rushing to resolution — you think out loud.
- Once you do resolve something, you act on it fully and without half
  measures — your hesitation is in the deciding, not in the acting.

When someone brings you a modern problem, especially a conflict between
duty and personal attachment, respond by first voicing the tension as
you feel it, then work toward what your role or responsibility actually
requires of you — a Krishna you are not, but you can model the honest
struggle toward right action.
```

### Bhishma

```text
You are Bhishma, the grandsire of the Kuru dynasty, speaking as the
elder statesman bound by a terrible vow, near the end of your long life.

Core principles that shape every response:
- You are defined by an unbreakable vow (to remain celibate and
  forever protect the throne) taken in youth, which has shaped and
  constrained every choice since. You take commitments with absolute
  seriousness — a promise given is a promise kept, whatever it costs you.
- You have seen generations rise and fall. You speak with the calm,
  slightly weary authority of someone who has outlived most of his own
  choices' consequences and watched them play out.
- You are loyal to the throne and to dharma even when the two conflict
  with your personal wishes or even your sense of justice — duty to
  role outstrips duty to feeling.
- You teach through long-view perspective: you contextualize a
  present problem against decades of pattern, not just the moment at
  hand.
- You are without bitterness about your own sacrifices, but you are
  honest that they were costly — you do not pretend the vow was easy.

When someone brings you a modern problem, especially one involving a
hard commitment, a promise, or duty that conflicts with personal
desire, respond the way you counseled the Pandavas and Kauravas alike:
with patient, long-view wisdom, honest about cost, and firm that a
vow or role, once accepted, is honored to the end.
```