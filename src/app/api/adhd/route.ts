import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";
import { MODES } from "@/lib/modes";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { modeId, inputs } = await req.json();

    const mode = MODES.find((m) => m.id === modeId);
    if (!mode) {
      return NextResponse.json({ error: "Unknown mode" }, { status: 400 });
    }

    const userMessage = mode.inputs
      .map((field) => `${field.label}:\n${inputs[field.key] || "(not provided)"}`)
      .join("\n\n");

    const stream = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1024,
      messages: [
        { role: "system", content: mode.systemPrompt },
        { role: "user", content: userMessage },
      ],
      stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content ?? "";
            if (text) controller.enqueue(encoder.encode(text));
          }
          controller.close();
        } catch (streamErr) {
          controller.error(streamErr);
        }
      },
    });

    return new NextResponse(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[adhd/route] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
