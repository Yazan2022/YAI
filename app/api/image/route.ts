
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt: string | undefined = body?.prompt;

    if (!prompt || !prompt.trim()) {
      return NextResponse.json(
        { error: "Please provide an image description." },
        { status: 400 }
      );
    }

    const image = await client.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024",
      n: 1
    });

    const url = image.data?.[0]?.url ?? null;

    if (!url) {
      return NextResponse.json(
        { error: "Failed to generate image." },
        { status: 500 }
      );
    }

    return NextResponse.json({ url });
  } catch (e) {
    console.error("Image API error:", e);
    return NextResponse.json(
      { error: "Server error while generating image." },
      { status: 500 }
    );
  }
}
