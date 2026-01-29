import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { dashboardGenerationPrompt } from "@/lib/json-render/examples";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * POST /api/dashboard/generate
 * Generate a dashboard using AI from natural language prompt
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'prompt' in request body" },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured" },
        { status: 500 }
      );
    }

    // Call Claude API to generate dashboard JSON
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: dashboardGenerationPrompt,
      messages: [
        {
          role: "user",
          content: `Generate a dashboard JSON for the following request:\n\n${prompt}\n\nRespond ONLY with valid JSON, no explanation or markdown.`,
        },
      ],
    });

    // Extract text from response
    const textContent = message.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      return NextResponse.json(
        { error: "No text content in AI response" },
        { status: 500 }
      );
    }

    let dashboardJson;
    try {
      // Try to parse the JSON from the response
      // Handle case where AI might wrap in markdown code blocks
      let jsonText = textContent.text.trim();
      
      // Remove markdown code blocks if present
      if (jsonText.startsWith("```json")) {
        jsonText = jsonText.slice(7);
      } else if (jsonText.startsWith("```")) {
        jsonText = jsonText.slice(3);
      }
      if (jsonText.endsWith("```")) {
        jsonText = jsonText.slice(0, -3);
      }
      jsonText = jsonText.trim();

      dashboardJson = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", textContent.text);
      return NextResponse.json(
        {
          error: "AI response was not valid JSON",
          raw: textContent.text.substring(0, 500),
        },
        { status: 500 }
      );
    }

    // Basic validation
    if (!dashboardJson.version || dashboardJson.version !== 1) {
      // Fix the version if missing
      dashboardJson.version = 1;
    }

    if (!dashboardJson.layout || !Array.isArray(dashboardJson.layout)) {
      return NextResponse.json(
        { error: "Invalid dashboard: missing 'layout' array" },
        { status: 500 }
      );
    }

    // Validate components have required fields
    const validateComponent = (comp: unknown): boolean => {
      if (typeof comp !== "object" || comp === null) return false;
      const c = comp as Record<string, unknown>;
      if (!c.component || typeof c.component !== "string") return false;
      if (c.children && Array.isArray(c.children)) {
        return c.children.every(validateComponent);
      }
      return true;
    };

    const allValid = dashboardJson.layout.every(validateComponent);
    if (!allValid) {
      return NextResponse.json(
        { error: "Invalid dashboard: components missing 'component' field" },
        { status: 500 }
      );
    }

    return NextResponse.json(dashboardJson);
  } catch (error) {
    console.error("Error generating dashboard:", error);
    return NextResponse.json(
      {
        error: "Failed to generate dashboard",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
