import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Missing OPENAI_API_KEY on server. Add it in Vercel → Project → Settings → Environment Variables."
        },
        { status: 500 }
      );
    }

    const client = new OpenAI({ apiKey });

    const body = await req.json();
    const messages = body?.messages;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Missing messages array in request body." },
        { status: 400 }
      );
    }

    const completion = await client.chat.completions.create({
      // لو حاب تجرب موديل ثاني جرّب gpt-4o-mini
      model: "gpt-4.1-mini",
      messages
    });

    const reply = completion.choices[0]?.message?.content ?? "";
    return NextResponse.json({ reply });
  } catch (e: any) {
    console.error("Chat API error:", e);
    let msg = "Unknown server error while generating reply.";

    if (e?.message) {
      msg = e.message;
    } else {
      try {
        msg = JSON.stringify(e);
      } catch {
        // تجاهل
      }
    }

    return NextResponse.json(
      { error: `OpenAI error: ${msg}` },
      { status: 500 }
    );
  }
}
