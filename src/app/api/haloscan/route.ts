import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const keyword = request.nextUrl.searchParams.get("keyword");
  if (!keyword) {
    return NextResponse.json({ error: "keyword parameter required" }, { status: 400 });
  }

  const apiKey = process.env.HALOSCAN_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Haloscan API key not configured" }, { status: 500 });
  }

  try {
    // Haloscan keyword suggestions endpoint
    const res = await fetch(
      `https://api.haloscan.com/v1/keyword-suggestions?keyword=${encodeURIComponent(keyword)}&country=FR&language=fr`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Haloscan API error: ${res.status}`, details: text },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch from Haloscan" },
      { status: 500 }
    );
  }
}
