import OpenAI from "openai";
import { RateLimiter } from "limiter";
import { logInfo } from "./logger";
import { withRetry } from "./error-handling";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MAX_REQUESTS_PER_MINUTE = 60; // OpenAI's rate limit

if (!OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not set in environment variables");
}

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// Rate limiter for OpenAI API calls
const limiter = new RateLimiter({
  tokensPerInterval: MAX_REQUESTS_PER_MINUTE,
  interval: "minute",
});

// Cost per 1K tokens (as of March 2024)
const COST_PER_1K_TOKENS = {
  "gpt-3.5-turbo": {
    input: 0.0005,
    output: 0.0015,
  },
  "gpt-4": {
    input: 0.03,
    output: 0.06,
  },
};

interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
}

function calculateCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const costs = COST_PER_1K_TOKENS[model as keyof typeof COST_PER_1K_TOKENS];
  if (!costs) return 0;

  const inputCost = (promptTokens / 1000) * costs.input;
  const outputCost = (completionTokens / 1000) * costs.output;

  return inputCost + outputCost;
}

async function makeRateLimitedRequest<T>(
  requestFn: () => Promise<T>
): Promise<T> {
  const hasToken = await limiter.tryRemoveTokens(1);
  if (!hasToken) {
    throw new Error("Rate limit exceeded. Please try again later.");
  }
  return requestFn();
}

export interface SummaryOptions {
  maxLength?: number;
  format?: "bullet" | "paragraph";
  includeKeyPoints?: boolean;
}

export interface SentimentAnalysisResult {
  sentiment: "positive" | "negative" | "neutral";
  confidence: number;
  keyPhrases: string[];
}

export interface TopicExtractionResult {
  mainTopics: string[];
  subtopics: Record<string, string[]>;
  confidence: number;
}

export async function generateSummary(
  text: string,
  options: SummaryOptions = {}
): Promise<{ summary: string; usage: TokenUsage }> {
  const {
    maxLength = 200,
    format = "paragraph",
    includeKeyPoints = true,
  } = options;

  const prompt = `Please provide a concise summary of the following text. 
  ${format === "bullet" ? "Use bullet points." : "Write in paragraph form."}
  ${includeKeyPoints ? "Include key points." : ""}
  Maximum length: ${maxLength} words.
  
  Text to summarize:
  ${text}`;

  try {
    const completion = await withRetry(() =>
      makeRateLimitedRequest(() =>
        openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant that creates concise, accurate summaries.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 500,
        })
      )
    );

    const usage = completion.usage;
    const cost = calculateCost(
      "gpt-3.5-turbo",
      usage.prompt_tokens,
      usage.completion_tokens
    );

    logInfo("OpenAI API call", {
      model: "gpt-3.5-turbo",
      operation: "generateSummary",
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
      totalTokens: usage.total_tokens,
      cost,
    });

    return {
      summary: completion.choices[0].message.content || "Failed to generate summary.",
      usage: {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
        cost,
      },
    };
  } catch (error) {
    logError("OpenAI API error", {
      error,
      operation: "generateSummary",
      model: "gpt-3.5-turbo",
    });
    throw error;
  }
}

export async function extractKeyPoints(text: string): Promise<string[]> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that extracts key points from text.",
        },
        {
          role: "user",
          content: `Extract the main key points from this text. Return them as a JSON array of strings:
          ${text}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const response = completion.choices[0].message.content;
    if (!response) {
      throw new Error("No response from OpenAI");
    }

    try {
      return JSON.parse(response);
    } catch (parseError) {
      // If JSON parsing fails, split the response into lines
      return response
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
    }
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to extract key points. Please try again later.");
  }
}

export async function generateQuestions(text: string, count: number = 5): Promise<string[]> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that generates relevant questions about text content.",
        },
        {
          role: "user",
          content: `Generate ${count} relevant questions about this text. Return them as a JSON array of strings:
          ${text}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const response = completion.choices[0].message.content;
    if (!response) {
      throw new Error("No response from OpenAI");
    }

    try {
      return JSON.parse(response);
    } catch (parseError) {
      // If JSON parsing fails, split the response into lines
      return response
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
    }
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to generate questions. Please try again later.");
  }
}

export async function analyzeSentiment(text: string): Promise<SentimentAnalysisResult> {
  try {
    const completion = await makeRateLimitedRequest(() =>
      openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a sentiment analysis expert. Analyze the sentiment of the text and return a JSON object with sentiment (positive/negative/neutral), confidence (0-1), and key phrases that influenced the sentiment.",
          },
          {
            role: "user",
            content: `Analyze the sentiment of this text and return a JSON object:
            ${text}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      })
    );

    const response = completion.choices[0].message.content;
    if (!response) {
      throw new Error("No response from OpenAI");
    }

    try {
      return JSON.parse(response);
    } catch (parseError) {
      throw new Error("Failed to parse sentiment analysis result");
    }
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to analyze sentiment. Please try again later.");
  }
}

export async function extractTopics(text: string): Promise<TopicExtractionResult> {
  try {
    const completion = await makeRateLimitedRequest(() =>
      openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a topic extraction expert. Extract main topics and subtopics from the text and return a JSON object with mainTopics (array), subtopics (object with arrays), and confidence (0-1).",
          },
          {
            role: "user",
            content: `Extract topics from this text and return a JSON object:
            ${text}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      })
    );

    const response = completion.choices[0].message.content;
    if (!response) {
      throw new Error("No response from OpenAI");
    }

    try {
      return JSON.parse(response);
    } catch (parseError) {
      throw new Error("Failed to parse topic extraction result");
    }
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to extract topics. Please try again later.");
  }
} 