import { NextResponse } from "next/server";

import { searchWorkspaceRecords } from "@/lib/search/global";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  try {
    const results = await searchWorkspaceRecords(query);
    return NextResponse.json(results);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Global search failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
