import { NextResponse } from "next/server";

import { generateBusinessExportCsv } from "@/lib/exports/business";

export async function GET(
  _request: Request,
  { params }: { params: Promise<unknown> },
) {
  const resolvedParams = (await params) as { exportKey?: string };

  try {
    const exportFile = await generateBusinessExportCsv(resolvedParams.exportKey ?? "");

    return new NextResponse(exportFile.content, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${exportFile.filename}"`,
        "cache-control": "no-store, max-age=0",
        "x-sdds-export-key": exportFile.definition.key,
        "x-sdds-export-rows": String(exportFile.rowCount),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate the export.";
    const status = message === "Unknown export set." ? 404 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
