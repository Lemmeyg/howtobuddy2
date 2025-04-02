import { NextResponse } from "next/server";
import {
  generateSummary,
  extractKeyPoints,
  generateQuestions,
  analyzeSentiment,
  extractTopics,
} from "@/lib/openai";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text, type, options } = body;

    if (!text) {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    let result;
    switch (type) {
      case "summary":
        result = await generateSummary(text, options);
        break;
      case "keyPoints":
        result = await extractKeyPoints(text);
        break;
      case "questions":
        result = await generateQuestions(text, options?.count);
        break;
      case "sentiment":
        result = await analyzeSentiment(text);
        break;
      case "topics":
        result = await extractTopics(text);
        break;
      default:
        return NextResponse.json(
          { error: "Invalid request type" },
          { status: 400 }
        );
    }

    return NextResponse.json({ result });
  } catch (error: any) {
    console.error("OpenAI API error:", error);
    
    // Handle rate limit errors specifically
    if (error.message.includes("Rate limit exceeded")) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to process request" },
      { status: 500 }
    );
  }
} 