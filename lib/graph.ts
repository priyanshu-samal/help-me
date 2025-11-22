import { StateGraph, END } from "@langchain/langgraph";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import { querySimilar } from "./rag";

// Define the State
interface AgentState {
    messages: (HumanMessage | SystemMessage | AIMessage)[];
    context: string;
    user_profile: any;
    missing_skills: string[];
}

function getModel() {
    return new ChatGoogleGenerativeAI({
        model: "gemini-2.0-flash",
        temperature: 0.7,
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || "dummy-key-for-build",
    });
}

// Node: Retrieve Context
async function retrieveNode(state: AgentState) {
    const lastMessage = state.messages[state.messages.length - 1];
    const query = lastMessage.content as string;

    // Retrieve from Vector Store
    const docs = await querySimilar(query);
    const context = docs.map(d => d.text).join("\n\n");

    return { context };
}

// Node: Generate Response
async function generateNode(state: AgentState) {
    const { messages, context, user_profile } = state;
    const query = messages[messages.length - 1].content;

    const systemPrompt = `You are a highly intelligent personal AI agent for a software engineer.
  Your goal is to write the BEST possible reply, DM, or email on behalf of the user.
  
  **User Profile**:
  ${JSON.stringify(user_profile)}
  
  **Retrieved Context (Resume/Bio)**:
  ${context}
  
  **Strategy**:
  1. **Deep Skill Extraction**: Look at the retrieved context and profile. If the user has used a library (e.g., 'boto3'), assume they know the underlying tech (AWS).
  2. **Pivot Mode**: If the request asks for a skill the user LACKS, do NOT lie. Instead, PIVOT.
     - Example: "I don't have X, but I have deep experience in Y which is similar because..."
     - Turn weaknesses into strengths by highlighting adaptability and foundational knowledge.
  3. **Tone**: Professional, confident, but authentic.
  
  **Task**:
  Generate the response for: "${query}"
  `;

    const response = await getModel().invoke([
        new SystemMessage(systemPrompt),
        ...messages
    ]);

    return { messages: [response] };
}

// Build the Graph
const workflow = new StateGraph<AgentState>({
    channels: {
        messages: {
            value: (x: any, y: any) => x.concat(y),
            default: () => [],
        },
        context: {
            value: (x: any, y: any) => y,
            default: () => "",
        },
        user_profile: {
            value: (x: any, y: any) => y,
            default: () => ({}),
        },
        missing_skills: {
            value: (x: any, y: any) => y,
            default: () => [],
        }
    }
})
    .addNode("retrieve", retrieveNode)
    .addNode("generate", generateNode)
    .addEdge("retrieve", "generate")
    .setEntryPoint("retrieve")
    .addEdge("generate", END);

export const graph = workflow.compile();
