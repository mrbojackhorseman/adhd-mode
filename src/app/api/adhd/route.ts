import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { MODES } from "@/lib/modes";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { modeId, inputs } = await req.json();

  const mode = MODES.find((m) => m.id === modeId);
  if (!mode) {
    return NextResponse.json({ error: "Unknown mode" }, { status: 400 });
  }

  const userMessage = mode.inputs
    .map((field) => `${field.label}:\n${inputs[field.key] || "(not provided)"}`)
    .join("\n\n");

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: mode.systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          controller.enqueue(encoder.encode(chunk.delta.text));
        }
      }
      controller.close();
    },
  });

  return new NextResponse(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}
