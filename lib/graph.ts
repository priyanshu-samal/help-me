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
  3. **Relevance Check**:
     - Verify if the project uses the requested stack OR equivalent technology (e.g., Mongoose = MongoDB, NeonDB = Postgres).
     - If a project has *most* of the stack, cite it and explain the difference (e.g., "I used Postgres instead of MongoDB").
     - Do NOT invent projects. Use the retrieved context.
  4. **Tone**: Professional, confident, but authentic.
  4. **For DMs/Emails**:
     - **Hook**: Start with something specific about the recipient or their work.
     - **Value**: Briefly state why you are a good fit using specific project examples.
     - **Call to Action**: End with a clear next step.
     - **Links**: Always include links to the user's portfolio or GitHub if relevant.
  
  **Style Examples (Mimic this high-signal, low-fluff style)**:
  - "Your new reasoning model is SOTA on GSM8K but still fails chain-of-thought on 17% of edge cases. I literally solved that exact failure mode at OpenAI last year – went from 83% → 99.2% pass@1. Code + internal benchmark: github.com/yourname/gsm-hard-fixes. Worth 10 mins to never see those red bars again?"
  - "Watched your live demo yesterday – insane progress. At t=4s your vision encoder OOM’d on my M3 MacBook. I have a 2-line quantization trick that fixes it (820 → 120 MB, same accuracy). Built it for LLaVA-Minitron last month: link.to/blog. Want the patch?"
  - "Saw you're hiring a Senior ML Engineer. Your reqs nailed it—I've led RAG pipelines that cut retrieval latency 7x on 10B+ docs at [ex-co]. Exactly what scaled their production agents to 99.99% uptime. Portfolio case study + GitHub (with evals): [link]. Worth a quick call to see if I can hit the ground running?"

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
