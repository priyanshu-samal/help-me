import { Pinecone } from "@pinecone-database/pinecone";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";
import crypto from "crypto";

export interface Document {
    id: string;
    text: string;
    vector: number[];
    metadata: string; // JSON stringified metadata
}

// Initialize Gemini Embeddings Lazily
function getEmbeddings() {
    return new GoogleGenerativeAIEmbeddings({
        model: "text-embedding-004",
        taskType: TaskType.RETRIEVAL_DOCUMENT,
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || "dummy-key-for-build",
    });
}

let pineconeInstance: Pinecone | null = null;

function getPinecone() {
    if (!pineconeInstance) {
        const apiKey = process.env.PINECONE_API_KEY;
        if (!apiKey) {
            throw new Error("PINECONE_API_KEY is missing from environment variables.");
        }
        pineconeInstance = new Pinecone({ apiKey });
    }
    return pineconeInstance;
}

async function ensureIndex() {
    const client = getPinecone();
    const indexName = process.env.PINECONE_INDEX || "helper-agent";

    try {
        const existingIndexes = await client.listIndexes();
        // @ts-ignore
        const indexExists = existingIndexes.indexes?.some(idx => idx.name === indexName);

        if (!indexExists) {
            console.log(`Creating Pinecone index: ${indexName}...`);
            await client.createIndex({
                name: indexName,
                dimension: 768, // text-embedding-004 uses 768 dimensions
                metric: "cosine",
                spec: {
                    serverless: {
                        cloud: "aws",
                        region: "us-east-1",
                    },
                },
            });
            // Wait for index to be ready
            await new Promise(resolve => setTimeout(resolve, 10000));
        }
    } catch (error) {
        console.error("Error ensuring Pinecone index:", error);
        throw error;
    }
}

async function getIndex() {
    await ensureIndex();
    const client = getPinecone();
    const indexName = process.env.PINECONE_INDEX || "helper-agent";
    return client.index(indexName);
}

export async function addDocuments(docs: { text: string; metadata: Record<string, any> }[]) {
    const index = await getIndex();
    const embeddings = getEmbeddings();

    // Process in batches to avoid rate limits and Pinecone payload limits
    const BATCH_SIZE = 5;
    const DELAY_MS = 1000;

    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
        const batchDocs = docs.slice(i, i + BATCH_SIZE);
        const batchTexts = batchDocs.map(d => d.text);

        try {
            console.log(`Embedding batch ${i / BATCH_SIZE + 1} of ${Math.ceil(docs.length / BATCH_SIZE)}...`);
            console.log(`Sample text: ${batchTexts[0].substring(0, 50)}...`); // Log first 50 chars

            const vectors = await embeddings.embedDocuments(batchTexts);

            if (!vectors || vectors.length === 0) {
                console.error("Error: No vectors returned from embedDocuments");
                continue;
            }

            console.log(`Generated ${vectors.length} vectors. Dimension of first vector: ${vectors[0]?.length}`);

            const pineconeRecords = batchDocs.map((doc, idx) => ({
                id: crypto.randomUUID(),
                values: vectors[idx] || [], // Ensure fallback to empty array if undefined
                metadata: {
                    ...doc.metadata,
                    text: doc.text, // Store text in metadata for retrieval
                },
            }));

            // Filter out invalid vectors
            const validRecords = pineconeRecords.filter(r => r.values.length === 768);
            if (validRecords.length < pineconeRecords.length) {
                console.error(`Warning: ${pineconeRecords.length - validRecords.length} records dropped due to invalid vector dimensions.`);
            }

            if (validRecords.length > 0) {
                await index.upsert(validRecords);
            }

            if (i + BATCH_SIZE < docs.length) {
                await new Promise(resolve => setTimeout(resolve, DELAY_MS));
            }
        } catch (error) {
            console.error(`Error embedding/upserting batch ${i / BATCH_SIZE + 1}:`, error);
            throw error;
        }
    }
}

export async function querySimilar(query: string, k: number = 15) {
    const index = await getIndex();
    const embeddings = getEmbeddings();

    try {
        const queryVector = await embeddings.embedQuery(query);

        const results = await index.query({
            vector: queryVector,
            topK: k,
            includeMetadata: true,
        });

        return results.matches.map((match) => ({
            text: (match.metadata?.text as string) || "",
            metadata: match.metadata,
            score: match.score,
        }));
    } catch (e) {
        console.error("Error querying Pinecone:", e);
        return [];
    }
}

export async function clearMemory() {
    const index = await getIndex();
    try {
        // Delete all vectors in the namespace (default namespace)
        await index.deleteAll();
    } catch (e) {
        console.error("Error clearing Pinecone memory:", e);
    }
}
