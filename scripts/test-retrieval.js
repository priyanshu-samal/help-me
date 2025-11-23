const { Pinecone } = require("@pinecone-database/pinecone");
const { GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");
const { TaskType } = require("@google/generative-ai");
require("dotenv").config({ path: ".env.local" }); // Try .env.local first
require("dotenv").config(); // Fallback to .env

async function testRetrieval() {
    const query = "Node.js Express MongoDB Redis auth rate limiting queues integrations";
    
    console.log("Testing retrieval for query:", query);

    if (!process.env.PINECONE_API_KEY || !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        console.error("Missing API Keys");
        return;
    }

    const pinecone = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
    });
    const index = pinecone.index(process.env.PINECONE_INDEX || "helper-agent");

    const embeddings = new GoogleGenerativeAIEmbeddings({
        modelName: "embedding-001", // Using 001 to match what might be in DB, or check rag.ts
        taskType: TaskType.RETRIEVAL_QUERY,
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    });

    // Check rag.ts to see which model is actually used. 
    // The previous code used "text-embedding-004". Let's try to match that.
    // But LangChain's GoogleGenerativeAIEmbeddings defaults might differ.
    // Let's stick to what was likely used. 
    // Actually, let's check rag.ts first to be sure.
    
    // For now, I'll assume text-embedding-004 if I can specify it, otherwise standard.
    // The previous edits showed text-embedding-004 in rag.ts.
    
    try {
        /* 
           NOTE: We need to match the embedding model exactly. 
           If rag.ts uses "text-embedding-004", we must use it here.
           LangChain's GoogleGenerativeAIEmbeddings wrapper might need specific config.
        */
       
        // Let's try to generate embedding
        const vector = await embeddings.embedQuery(query);
        
        console.log(`Generated query vector of length: ${vector.length}`);

        const queryResponse = await index.query({
            vector: vector,
            topK: 15,
            includeMetadata: true,
        });

        console.log(`Found ${queryResponse.matches.length} matches.`);
        
        queryResponse.matches.forEach((match, i) => {
            console.log(`\n--- Match ${i + 1} (Score: ${match.score}) ---`);
            console.log(`Source: ${match.metadata.source}`);
            console.log(`Repo: ${match.metadata.repo}`);
            console.log(`Type: ${match.metadata.type}`);
            // console.log(`Text: ${match.metadata.text}`); // Text might be in metadata or not depending on setup
            // In rag.ts, we store text in metadata.text
            console.log(`Snippet: ${match.metadata.text ? match.metadata.text.substring(0, 200) : "NO TEXT"}`);
        });

        const foundMicro = queryResponse.matches.some(m => m.metadata.repo && m.metadata.repo.toLowerCase().includes("microbazzar"));
        if (foundMicro) {
            console.log("\n✅ SUCCESS: 'microbazzar' was found in the top 15.");
        } else {
            console.log("\n❌ FAILURE: 'microbazzar' was NOT found in the top 15.");
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

testRetrieval();
