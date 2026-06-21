import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

import { getAuthenticatedWorkspaceSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parsePdfBuffer } from "@/lib/utils/pdf";

// ── Gemini-powered extraction ─────────────────────────────────────────────────

interface GeminiExtractedFields {
  pan: string | null;
  assessmentYear: string | null;
  itrForm: string | null;
  clientName: string | null;
  totalIncome: number | null;
  refundAmount: number | null;
  taxPayable: number | null;
}

async function extractWithGemini(
  buffer: Buffer
): Promise<GeminiExtractedFields | null> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    console.log("[PDF Extract] GOOGLE_GEMINI_API_KEY not set — skipping Gemini extraction.");
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // gemini-2.0-flash: fast, multimodal, supports PDF inline data
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `You are an expert at reading Indian Income Tax Return (ITR) documents and acknowledgement forms (ITR-V).

Extract the following fields from this PDF document and return ONLY a valid JSON object — no markdown, no explanation, just JSON.

Fields to extract:
1. pan          — PAN number (format: 5 uppercase letters, 4 digits, 1 uppercase letter; e.g. AEDPH9905C)
2. assessmentYear — Assessment year in "YYYY-YY" format (e.g. "2026-27")
3. itrForm      — ITR form type (e.g. "ITR-1", "ITR-2", "ITR-4", "ITR-V")
4. clientName   — Full name of the taxpayer as shown on the form
5. totalIncome  — Total income as a plain integer in Rupees (no commas, no symbols). Null if not present.
6. refundAmount — Net tax refund due as a plain integer (positive number). Null if not a refund case.
7. taxPayable   — Net tax payable as a plain integer (positive number). Null if not a tax-payable case.

Rules:
- refundAmount and taxPayable are mutually exclusive — only one can be non-null.
- A row labelled "(+) Tax Payable /(-) Refundable" is the authoritative source for refundAmount/taxPayable.
- All amounts must be plain integers (no ₹, no commas, no decimals unless meaningful).
- If a field cannot be found, set it to null.

Return exactly:
{"pan":..., "assessmentYear":..., "itrForm":..., "clientName":..., "totalIncome":..., "refundAmount":..., "taxPayable":...}`;

    const result = await model.generateContent([
      {
        inlineData: {
          data: buffer.toString("base64"),
          mimeType: "application/pdf",
        },
      },
      prompt,
    ]);

    const responseText = result.response.text().trim();
    console.log("[PDF Extract] Gemini raw response:", responseText.slice(0, 500));

    // Parse JSON — strip markdown code fences if Gemini added them
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn("[PDF Extract] Gemini response contained no JSON object.");
      return null;
    }

    const data = JSON.parse(jsonMatch[0]) as Record<string, unknown>;

    const safeNum = (v: unknown): number | null => {
      const n = Number(v);
      return isFinite(n) && n > 0 ? Math.round(n) : null;
    };

    return {
      pan: typeof data.pan === "string" ? data.pan : null,
      assessmentYear:
        typeof data.assessmentYear === "string" ? data.assessmentYear : null,
      itrForm: typeof data.itrForm === "string" ? data.itrForm : null,
      clientName:
        typeof data.clientName === "string" ? data.clientName : null,
      totalIncome: safeNum(data.totalIncome),
      refundAmount: safeNum(data.refundAmount),
      taxPayable: safeNum(data.taxPayable),
    };
  } catch (error) {
    console.error("[PDF Extract] Gemini extraction failed:", error);
    return null;
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const resolvedParams = await params;
    const session = await getAuthenticatedWorkspaceSession();
    const supabase = await createSupabaseServerClient();

    // 1. Fetch document metadata and workspace invoice settings in parallel
    const [{ data: document, error: fetchError }, { data: invoiceSettings }] =
      await Promise.all([
        supabase
          .from("documents")
          .select("storage_path, original_filename, client_id, assessment_year_id")
          .eq("workspace_id", session.workspace.id)
          .eq("id", resolvedParams.documentId)
          .is("archived_at", null)
          .single(),
        supabase
          .from("workspace_invoice_settings")
          .select("rate_card, refund_charge_percentage, pdf_extraction_settings")
          .eq("workspace_id", session.workspace.id)
          .maybeSingle(),
      ]);

    if (fetchError || !document) {
      return NextResponse.json(
        { error: "Document not found or inaccessible." },
        { status: 404 }
      );
    }

    // 2. Download file buffer from storage
    const { data: fileBlob, error: downloadError } = await supabase.storage
      .from("sdds-documents")
      .download(document.storage_path);

    if (downloadError || !fileBlob) {
      return NextResponse.json(
        { error: `Failed to download file: ${downloadError?.message}` },
        { status: 500 }
      );
    }

    const arrayBuffer = await fileBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. Try Gemini-powered extraction first; fall back to regex parser
    let parsedData: {
      pan: string | null;
      assessmentYear: string | null;
      itrForm: string | null;
      clientName: string | null;
      refundAmount: number | null;
      totalIncome: number | null;
      taxPayable: number | null;
    };

    const geminiResult = await extractWithGemini(buffer);

    if (geminiResult) {
      console.log("[PDF Extract] Using Gemini extraction:", geminiResult);
      parsedData = geminiResult;
    } else {
      // Regex fallback
      const extractionSettings = invoiceSettings?.pdf_extraction_settings as
        | { page_scope?: string; itr_form_pattern?: string; refund_amount_pattern?: string }
        | undefined;
      const regexResult = await parsePdfBuffer(buffer, extractionSettings);

      // Diagnostic log for regex fallback
      console.log(
        "[PDF Extract] Regex fallback — raw text (first 1500 chars):\n",
        regexResult.rawText.slice(0, 1500)
      );
      console.log("[PDF Extract] Regex fallback parsed fields:", {
        pan: regexResult.pan,
        assessmentYear: regexResult.assessmentYear,
        itrForm: regexResult.itrForm,
        clientName: regexResult.clientName,
        refundAmount: regexResult.refundAmount,
        totalIncome: regexResult.totalIncome,
        taxPayable: regexResult.taxPayable,
      });

      parsedData = regexResult;
    }

    return NextResponse.json({
      success: true,
      data: {
        pan: parsedData.pan,
        assessmentYear: parsedData.assessmentYear,
        itrForm: parsedData.itrForm,
        clientName: parsedData.clientName,
        refundAmount: parsedData.refundAmount,
        totalIncome: parsedData.totalIncome,
        taxPayable: parsedData.taxPayable,
        clientId: document.client_id,
        assessmentYearId: document.assessment_year_id,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to extract PDF data.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
