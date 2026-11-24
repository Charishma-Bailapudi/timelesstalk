import { google } from "@ai-sdk/google";
import { Pinecone } from "@pinecone-database/pinecone";
import { embedMany } from "ai";
import { config } from "dotenv";

config({ path: ".env.local" });

interface PersonaPassage {
  text: string;
  source: string;
}

type BuiltInPersonaId =
  | "marcus"
  | "arjuna"
  | "bhishma"
  | "chanakya"
  | "vivekananda"
  | "kalam"
  | "socrates"
  | "tesla"
  | "cleopatra"
  | "davinci";

const passages: Record<BuiltInPersonaId, PersonaPassage[]> = {
  marcus: [
    {
      text: "A person cannot command outside events, but can govern their own judgments and choices. Begin by separating what is yours to direct from what is not.",
      source: "Meditations, Book 2",
    },
    {
      text: "Other people's faults need not become your own burden. Correct what you can with fairness and meet the rest without surrendering your character.",
      source: "Meditations, Book 4",
    },
    {
      text: "The mind takes the shape of the thoughts it repeatedly entertains; keep returning it to what is just, temperate, and useful.",
      source: "Meditations, Book 5",
    },
    {
      text: "What obstructs an action can become material for another action. An obstacle may teach patience, courage, or a better method.",
      source: "Meditations, Book 5",
    },
    {
      text: "Remember the shortness of life and the kinship of human beings; let neither resentment nor vanity consume the time given to you.",
      source: "Meditations, Book 6",
    },
    {
      text: "Do the work before you with care, as a rational and social being would do it. Do not spend the day arguing about goodness instead of practicing it.",
      source: "Meditations, Book 10",
    },
  ],
  arjuna: [
    {
      text: "Seeing teachers, relatives, and friends on both sides of the battlefield, Arjuna describes his body failing and his bow slipping from his hand.",
      source: "Bhagavad Gita, Chapter 1",
    },
    {
      text: "Arjuna questions whether victory is worth its cost when the people with whom he would share it may be lost.",
      source: "Bhagavad Gita, Chapter 1",
    },
    {
      text: "He objects that revered elders and teachers stand among his opponents, revealing how affection and duty collide in his mind.",
      source: "Bhagavad Gita, Chapter 2",
    },
    {
      text: "Unable to resolve the conflict alone, Arjuna asks Krishna to teach him what is right and accepts the role of a student seeking guidance.",
      source: "Bhagavad Gita, Chapter 2",
    },
    {
      text: "After receiving Krishna's teaching, Arjuna asks to see the divine form, seeking direct understanding rather than relying only on words.",
      source: "Bhagavad Gita, Chapter 11",
    },
    {
      text: "At the end of the dialogue, Arjuna says his confusion has lifted and that he is ready to act according to the counsel he has understood.",
      source: "Bhagavad Gita, Chapter 18",
    },
  ],
  bhishma: [
    {
      text: "In his instruction to Yudhishthira, Bhishma treats protection of the people as a central duty of kingship, not merely a claim to authority.",
      source: "Mahabharata, Shanti Parva",
    },
    {
      text: "Bhishma's life is shaped by a vow made to secure his father's happiness and the succession, a promise whose consequences extend across generations.",
      source: "Mahabharata, Adi Parva",
    },
    {
      text: "His counsel presents patience and self-restraint as strengths: anger may feel forceful, yet a ruler must consider what it will set in motion.",
      source: "Mahabharata, Shanti Parva",
    },
    {
      text: "Bhishma teaches that truthful speech matters, while also requiring judgment about timing, purpose, and the harm words may cause.",
      source: "Mahabharata, Anushasana Parva",
    },
    {
      text: "In his final teachings, he describes generosity as a duty that recognizes another person's need rather than a performance for praise.",
      source: "Mahabharata, Anushasana Parva",
    },
    {
      text: "Bhishma's long view is marked by the cost of loyalty: duty to an office can bind a person even when private judgment sees its painful limits.",
      source: "Mahabharata, Shanti Parva",
    },
  ],
  chanakya: [
    {
      text: "The Arthashastra treats training and disciplined conduct as foundations of leadership; a ruler who cannot govern himself will struggle to govern a realm.",
      source: "Arthashastra, Book 1",
    },
    {
      text: "A wise policy begins with examining likely gains, losses, dangers, and the strength of the available means before committing to action.",
      source: "Arthashastra, Book 7",
    },
    {
      text: "The work of government includes protecting livelihoods and maintaining order, because a kingdom's strength depends on the well-being of its people.",
      source: "Arthashastra, Book 1",
    },
    {
      text: "Counsel should be deliberate and confidential: gather capable advisers, test a plan, and avoid allowing careless talk to defeat sound preparation.",
      source: "Arthashastra, Book 1",
    },
    {
      text: "The text emphasizes watchfulness against corruption and misuse of public resources, recommending oversight rather than blind trust in officials.",
      source: "Arthashastra, Book 2",
    },
    {
      text: "Chanakya's political teaching values practical judgment: choose the course that protects the state over time, not the one that merely flatters pride.",
      source: "Arthashastra, Book 7",
    },
  ],
  vivekananda: [
    {
      text: "Vivekananda presents each person as capable of spiritual growth and warns against reducing human worth to weakness or social status.",
      source: "Complete Works, Volume 1",
    },
    {
      text: "In Karma Yoga, work is a discipline: act wholeheartedly, but do not make your peace depend entirely on receiving a particular reward.",
      source: "Complete Works, Karma Yoga",
    },
    {
      text: "His address at the World's Parliament of Religions opens with a greeting that emphasizes kinship across religious and cultural boundaries.",
      source: "Chicago Address, 1893",
    },
    {
      text: "Vivekananda argues that religious practice should deepen compassion and service, not become a reason to despise people who follow another path.",
      source: "Complete Works, Volume 2",
    },
    {
      text: "He urges students to cultivate concentration and character, seeing disciplined attention as a practical aid to learning and purposeful work.",
      source: "Complete Works, Volume 3",
    },
    {
      text: "His teaching joins inner realization with service: the search for truth should make a person more useful and generous toward others.",
      source: "Complete Works, Volume 5",
    },
  ],
  kalam: [
    {
      text: "Kalam's account of his early life emphasizes education, supportive teachers, and steady effort as forces that helped a modest beginning grow into a scientific career.",
      source: "Wings of Fire",
    },
    {
      text: "His reflections on launch failures describe how a team can learn from setbacks when leaders take responsibility and convert evidence into a better design.",
      source: "Wings of Fire",
    },
    {
      text: "Kalam's work on India's space program joins technical ambition with teamwork, persistence, and patient institution-building.",
      source: "Wings of Fire",
    },
    {
      text: "In his writing for young people, he treats a dream as a beginning that must be followed by learning, planning, and sustained work.",
      source: "Ignited Minds",
    },
    {
      text: "Kalam presents scientific development as a public responsibility, asking how knowledge and technology can improve life beyond the laboratory.",
      source: "India 2020",
    },
    {
      text: "His later years as a teacher reflect a conviction that young people should be encouraged to question, imagine, and contribute to their communities.",
      source: "Selected speeches and lectures",
    },
  ],
  socrates: [
    {
      text: "In the Apology, Socrates says that examining himself and others is part of his service to the city, even when such questioning makes him unpopular.",
      source: "Plato, Apology",
    },
    {
      text: "Socrates questions claims to wisdom by asking what the speaker truly knows, exposing the difference between confidence and understanding.",
      source: "Plato, Apology",
    },
    {
      text: "In Crito, he refuses to escape prison simply to avoid death, reasoning that one must not answer an injustice by committing another.",
      source: "Plato, Crito",
    },
    {
      text: "The dialogues show Socrates asking for clear definitions of virtues such as courage and justice before accepting broad claims about them.",
      source: "Plato, Laches",
    },
    {
      text: "In Meno, Socrates tests whether virtue can be taught by examining what virtue is, rather than assuming an answer at the outset.",
      source: "Plato, Meno",
    },
    {
      text: "The Socratic method proceeds through questions and tested answers, inviting a person to discover contradictions and refine their beliefs.",
      source: "Plato, Republic",
    },
  ],
  tesla: [
    {
      text: "Tesla describes mentally visualizing a machine, inspecting its imagined operation, and correcting its design before constructing a physical model.",
      source: "My Inventions, 1919",
    },
    {
      text: "His account of the rotating magnetic field shows how a theoretical insight can become practical machinery through patient engineering.",
      source: "My Inventions, 1919",
    },
    {
      text: "Tesla's work on alternating current helped make long-distance electrical transmission more practical and shaped the modern power system.",
      source: "My Inventions, 1919",
    },
    {
      text: "In his writings on energy and industry, Tesla considers how inventions can change daily life, while warning that progress has social consequences.",
      source: "The Problem of Increasing Human Energy, 1900",
    },
    {
      text: "Tesla's experimental practice combines bold hypotheses with repeated measurement; an elegant idea still has to answer to physical results.",
      source: "My Inventions, 1919",
    },
    {
      text: "He regards close study of natural forces as a source of engineering insight, looking for principles that can be translated into useful devices.",
      source: "The Problem of Increasing Human Energy, 1900",
    },
  ],
  cleopatra: [
    {
      text: "Cleopatra ruled Egypt as a monarch in her own right and worked to preserve the kingdom's power amid Roman civil conflict.",
      source: "Plutarch, Life of Antony",
    },
    {
      text: "Ancient accounts describe Cleopatra as a multilingual ruler able to speak directly with representatives of different peoples.",
      source: "Plutarch, Life of Antony",
    },
    {
      text: "Her meeting with Julius Caesar took place within a struggle over Egypt's throne, making diplomacy inseparable from dynastic survival.",
      source: "Plutarch, Life of Caesar",
    },
    {
      text: "Cleopatra's alliance with Mark Antony joined personal partnership to strategic interests in the eastern Mediterranean.",
      source: "Plutarch, Life of Antony",
    },
    {
      text: "Her coinage and royal presentation connected Ptolemaic traditions with the political realities of ruling a diverse kingdom.",
      source: "Ptolemaic coinage and royal inscriptions",
    },
    {
      text: "Later Roman writers shaped much of Cleopatra's surviving image, so careful history distinguishes political evidence from hostile storytelling.",
      source: "Plutarch, Life of Antony",
    },
  ],
  davinci: [
    {
      text: "Leonardo's notebooks repeatedly return to observation: study nature closely before trying to explain or imitate it.",
      source: "Leonardo da Vinci, Notebooks",
    },
    {
      text: "His studies of water trace patterns of flow and turbulence, treating careful drawing as a way to investigate motion.",
      source: "Leonardo da Vinci, Notebooks on Water",
    },
    {
      text: "Leonardo examined human anatomy through dissection and drawing, relating visible form to the structure and movement beneath it.",
      source: "Anatomical Manuscripts",
    },
    {
      text: "His studies of light and shadow show how observation of nature can guide both scientific inquiry and the making of convincing images.",
      source: "Treatise on Painting",
    },
    {
      text: "Leonardo's engineering notebooks combine imaginative machines with sketches and calculations, though many designs remained studies rather than built devices.",
      source: "Codex Atlanticus",
    },
    {
      text: "He approached painting as an investigation of nature, asking the artist to learn from anatomy, perspective, plants, weather, and human expression.",
      source: "Treatise on Painting",
    },
  ],
};

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
  const index = pinecone.index(indexName);

  for (const [personaId, personaPassages] of Object.entries(passages)) {
    if (personaPassages.length < 6 || personaPassages.length > 8) {
      throw new Error(
        `Expected 6-8 passages for "${personaId}", found ${personaPassages.length}.`,
      );
    }

    const { embeddings } = await embedMany({
      model: embeddingModel,
      values: personaPassages.map((passage) => passage.text),
      dimensions: 768,
    });

    if (
      embeddings.length !== personaPassages.length ||
      embeddings.some((embedding) => embedding.length !== 768)
    ) {
      throw new Error(
        `Gemini returned invalid 768-dimensional embeddings for "${personaId}".`,
      );
    }

    await index.namespace(personaId).upsert({
      records: personaPassages.map((passage, passageIndex) => ({
        id: `${personaId}-${passageIndex + 1}`,
        values: embeddings[passageIndex],
        metadata: {
          text: passage.text,
          source: passage.source,
        },
      })),
    });

    console.log(
      `Seeded ${personaPassages.length} passages into "${indexName}/${personaId}".`,
    );
  }
}

main().catch((error) => {
  console.error("Failed to seed built-in personas:", error);
  process.exitCode = 1;
});
