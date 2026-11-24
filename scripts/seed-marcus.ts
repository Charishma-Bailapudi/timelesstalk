import { google } from "@ai-sdk/google";
import { Pinecone } from "@pinecone-database/pinecone";
import { embedMany } from "ai";
import { config } from "dotenv";

config({ path: ".env.local" });

const passages = [
  {
    id: "marcus-1",
    text: "You have power over your mind—not outside events. Realize this, and you will find strength.",
    source: "Meditations, Book 1",
  },
  {
    id: "marcus-2",
    text: "If you are distressed by anything external, the pain is not due to the thing itself, but to your estimate of it.",
    source: "Meditations, Book 8",
  },
  {
    id: "marcus-3",
    text: "The happiness of your life depends upon the quality of your thoughts.",
    source: "Meditations, Book 4",
  },
  {
    id: "marcus-4",
    text: "Begin each day by telling yourself: Today I shall be met by interference, ingratitude, insolence, disloyalty, ill will.",
    source: "Meditations, Book 2",
  },
  {
    id: "marcus-5",
    text: "How much trouble he avoids who does not look to see what his neighbor says or does or thinks.",
    source: "Meditations, Book 9",
  },
  {
    id: "marcus-6",
    text: "The universe is change; our life is what our thoughts make it.",
    source: "Meditations, Book 4",
  },
  {
    id: "marcus-7",
    text: "Do not act as if you were going to live ten thousand years. Death hangs over you; while you live, while it is in your power, be good.",
    source: "Meditations, Book 4",
  },
  {
    id: "marcus-8",
    text: "Waste no more time arguing what a good man should be. Be one.",
    source: "Meditations, Book 10",
  },
  {
    id: "marcus-9",
    text: "The best revenge is to not be like your enemy.",
    source: "Meditations, Book 6",
  },
  {
    id: "marcus-10",
    text: "Dwell on the beauty of life. Watch the stars, and see yourself running with them.",
    source: "Meditations, Book 7",
  },
  {
    id: "marcus-11",
    text: "Accept the things to which fate binds you, and love the people with whom fate brings you together with all your heart.",
    source: "Meditations, Book 7",
  },
  {
    id: "marcus-12",
    text: "You have to assemble your life yourself—action by action. Be content to finish the matter at hand.",
    source: "Meditations, Book 12",
  },
];

async function main() {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is missing.");
  }
  if (!process.env.PINECONE_API_KEY) {
    throw new Error("PINECONE_API_KEY is missing.");
  }

  const indexName = process.env.PINECONE_INDEX_NAME || "timelesstalk";
  const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

  const existingIndexes = await pinecone.indexes.list();
  const indexExists = existingIndexes.indexes?.some(
    (index) => index.name === indexName,
  );

  if (!indexExists) {
    console.log(`Creating Pinecone index "${indexName}"...`);
    await pinecone.indexes.create({
      name: indexName,
      dimension: 768,
      metric: "cosine",
      spec: {
        serverless: {
          cloud: "aws",
          region: "us-east-1",
        },
      },
      waitUntilReady: true,
    });
  }

  const embeddingModel = google.embedding("gemini-embedding-001");
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: passages.map((passage) => passage.text),
    dimensions: 768,
  });

  if (embeddings.some((embedding) => embedding.length !== 768)) {
    throw new Error("The Gemini embedding model did not return 768 dimensions.");
  }

  const index = pinecone.index(indexName).namespace("marcus");
  await index.upsert({
    records: passages.map((passage, index) => ({
      id: passage.id,
      values: embeddings[index],
      metadata: {
        text: passage.text,
        source: passage.source,
      },
    })),
  });

  console.log(
    `Seeded ${passages.length} Marcus Aurelius passages into "${indexName}/marcus".`,
  );
}

main().catch((error) => {
  console.error("Failed to seed Marcus Aurelius passages:", error);
  process.exitCode = 1;
});
