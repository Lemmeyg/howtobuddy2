import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Add CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    return NextResponse.json({
      success: true,
      message: "API is working!",
      timestamp: new Date().toISOString(),
      route: "/api/test"
    }, { headers });
  } catch (error) {
    console.error("Test API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500, headers }
    );
  }
} 