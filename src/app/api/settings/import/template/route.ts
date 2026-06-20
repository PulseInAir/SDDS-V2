import { NextResponse } from "next/server";

import { CSV_HEADERS } from "@/lib/imports/csv";
import { getAuthenticatedWorkspaceSession } from "@/lib/auth/session";

export async function GET() {
  try {
    // Verify that the user is authenticated in a workspace
    await getAuthenticatedWorkspaceSession();

    // Generate CSV content: header row + a trailing newline
    const csvContent = "\uFEFF" + CSV_HEADERS.join(",") + "\n";

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": 'attachment; filename="sdds-import-template.csv"',
        "cache-control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
