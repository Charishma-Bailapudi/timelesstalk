import { google } from "@ai-sdk/google";
import { Pinecone } from "@pinecone-database/pinecone";
import { embed } from "ai";

export interface RetrievedPassage {
  text: string;
  source: string;
  score: number;
}

export async function retrieveContext(
  personaId: string,
  query: string,
  topK = 3,
): Promise<RetrievedPassage[]> {
  try {
    if (!process.env.PINECONE_API_KEY) {
      console.warn("[RAG] PINECONE_API_KEY is missing.");
      return [];
    }

    const indexName = process.env.PINECONE_INDEX_NAME || "timelesstalk";
    const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
    const { embedding } = await embed({
      model: google.embedding("gemini-embedding-001"),
      value: query,
      dimensions: 768,
    });

    if (embedding.length !== 768) {
      console.warn("[RAG] The Gemini embedding model did not return 768 dimensions.");
      return [];
    }

    const index = pinecone
      .index(indexName)
      .namespace(personaId);

    const response = await index.query({
      vector: embedding,
      topK,
      includeMetadata: true,
    });

    return (response.matches ?? [])
      .map((match) => ({
        text:
          typeof match.metadata?.text === "string"
            ? match.metadata.text
            : "",
        source:
          typeof match.metadata?.source === "string"
            ? match.metadata.source
            : "Unknown source",
        score: match.score ?? 0,
      }))
      .filter((match) => match.text.length > 0);
  } catch (error) {
    console.warn(
      `[RAG] No records or index could be retrieved for "${personaId}".`,
      error,
    );
    return [];
  }
}
