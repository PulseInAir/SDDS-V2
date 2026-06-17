import { NextResponse } from "next/server";

import { getSignedDownloadUrl } from "@/lib/actions/documents";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const resolvedParams = await params;

  try {
    const signedUrl = await getSignedDownloadUrl(resolvedParams.documentId);
    return NextResponse.redirect(signedUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create download link.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
