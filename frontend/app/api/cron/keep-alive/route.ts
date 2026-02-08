import { NextResponse } from "next/server";

/**
 * Vercel Cron Job to keep Render backend alive 24/7
 * Pings the backend every 14 minutes to prevent it from sleeping
 */
export async function GET(request: Request) {
  try {
    // Verify this is a legitimate cron request (optional but recommended)
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      "https://cortexia-backend.onrender.com";
    const healthEndpoint = `${backendUrl}/api/health`;

    console.log(`[Keep-Alive] Pinging backend: ${healthEndpoint}`);

    const response = await fetch(healthEndpoint, {
      method: "GET",
      headers: {
        "User-Agent": "CorteXia-KeepAlive-Cron",
      },
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();

    console.log(`[Keep-Alive] Success:`, data);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      backendResponse: data,
    });
  } catch (error) {
    console.error("[Keep-Alive] Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
