import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAuthenticatedWorkspaceSession } from "@/lib/auth/session";

export async function GET(request: Request) {
  try {
    const session = await getAuthenticatedWorkspaceSession();
    const supabase = await createSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const assessmentYearId = searchParams.get("assessmentYearId");

    if (!clientId) {
      return NextResponse.json({ error: "Missing clientId" }, { status: 400 });
    }

    let query = supabase
      .from("documents")
      .select("*")
      .eq("workspace_id", session.workspace.id)
      .eq("client_id", clientId)
      .is("archived_at", null);

    if (assessmentYearId) {
      query = query.eq("assessment_year_id", assessmentYearId);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch documents." },
      { status: 500 }
    );
  }
}
