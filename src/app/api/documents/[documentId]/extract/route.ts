import { NextResponse } from "next/server";

import { getAuthenticatedWorkspaceSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parsePdfBuffer } from "@/lib/utils/pdf";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const resolvedParams = await params;
    const session = await getAuthenticatedWorkspaceSession();
    const supabase = await createSupabaseServerClient();

    // 1. Fetch document metadata
    const { data: document, error: fetchError } = await supabase
      .from("documents")
      .select("storage_path, original_filename, client_id, assessment_year_id")
      .eq("workspace_id", session.workspace.id)
      .eq("id", resolvedParams.documentId)
      .is("archived_at", null)
      .single();

    if (fetchError || !document) {
      return NextResponse.json({ error: "Document not found or inaccessible." }, { status: 404 });
    }

    // 2. Download file buffer from storage
    const { data: fileBlob, error: downloadError } = await supabase.storage
      .from("sdds-documents")
      .download(document.storage_path);

    if (downloadError || !fileBlob) {
      return NextResponse.json({ error: `Failed to download file: ${downloadError?.message}` }, { status: 500 });
    }

    const arrayBuffer = await fileBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. Parse PDF buffer
    const parsedData = await parsePdfBuffer(buffer);

    return NextResponse.json({
      success: true,
      data: {
        pan: parsedData.pan,
        assessmentYear: parsedData.assessmentYear,
        itrForm: parsedData.itrForm,
        clientName: parsedData.clientName,
        clientId: document.client_id,
        assessmentYearId: document.assessment_year_id,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to extract PDF data.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
