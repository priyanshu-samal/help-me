import { NextRequest, NextResponse } from "next/server";
import { graph } from "@/lib/graph";
import { HumanMessage } from "@langchain/core/messages";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { message } = body;

        if (!message) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }

        // Invoke the LangGraph agent
        const result = await graph.invoke({
            messages: [new HumanMessage(message)],
        }) as any;

        // Extract the last message from the agent
        const lastMessage = result.messages[result.messages.length - 1];
        const reply = lastMessage.content;

        return NextResponse.json({ reply });
    } catch (error) {
        console.error("Error in chat API:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
