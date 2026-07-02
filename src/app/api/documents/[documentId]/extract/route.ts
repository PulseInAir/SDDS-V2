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
    // gemini-2.0-flash: current stable model with full PDF inline-data support
    // (gemini-1.5-flash was removed from the v1beta endpoint)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `You are an expert at reading Indian Income Tax Return (ITR) acknowledgement forms (ITR-V) issued by the Income Tax Department of India.

Extract the following fields from this PDF document and return ONLY a valid JSON object — no markdown, no explanation, just raw JSON.

Fields to extract:
1. pan            — PAN number (format: 5 uppercase letters, 4 digits, 1 uppercase letter; e.g. AEDPH9905C)
2. assessmentYear — Assessment year in "YYYY-YY" format (e.g. "2026-27"). Found near the top of the acknowledgement.
3. itrForm        — ITR form type filed (e.g. "ITR-1", "ITR-2", "ITR-3", "ITR-4", "ITR-5", "ITR-6", "ITR-7"). Look for the specific form number filed, not the general header.
4. clientName     — The FULL NAME of the individual or entity taxpayer. 
                    CRITICAL STRICT RULES for clientName:
                    - MUST NOT start with "Where the data" or "Where the".
                    - MUST NOT be a sentence, instruction, or paragraph.
                    - MUST NOT contain terms like "SAHAJ", "SUGAM", "Form".
                    - It is typically a short proper noun printed in ALL CAPS near the top, often adjacent to or just above the address or PAN number.
5. totalIncome    — Total Income. Look for a field explicitly labelled "Total Income" (often field 14 or similar). Extract the numeric value as an integer. Return null if not found.
6. refundAmount   — Refund Amount. Look for "(+) Tax Payable / (-) Refundable" (often field 17 or similar) or a "Refund" field. If the value represents a refund (often indicated by a negative sign in the calculation or placed in a refund column), extract the absolute integer value. Return null if tax is payable.
7. taxPayable     — Tax Payable. Look for "(+) Tax Payable / (-) Refundable" or "Tax Payable". If the value represents tax owed, extract the absolute integer value. Return null if it's a refund.

Rules:
- refundAmount and taxPayable are mutually exclusive — only one can be non-null at a time.
- All amounts must be plain integers (no ₹, no commas, no decimals). Example: 60570.
- If a field genuinely cannot be found in the document, set it to null — do not guess or hallucinate.

Return exactly this JSON structure (no extra keys, no markdown fences):
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
      if (typeof v === "string") {
        v = v.replace(/,/g, "").trim();
      }
      const n = Number(v);
      return isFinite(n) && n >= 0 ? Math.round(n) : null;
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
    const msg = error instanceof Error ? error.message : String(error);
    // 429 quota exhausted or 404 model-not-found → fall back to regex parser
    // so extraction still works while billing/key issues are resolved.
    if (msg.includes("429") || msg.includes("Too Many Requests") ||
        msg.includes("404") || msg.includes("Not Found")) {
      console.warn(
        "[PDF Extract] Gemini unavailable (quota/model error) — falling back to regex parser:",
        msg.slice(0, 200)
      );
      return null;
    }
    // Unexpected errors are still surfaced so they appear in Vercel logs.
    console.error("[PDF Extract] Gemini extraction failed:", msg);
    throw new Error(`Gemini API error: ${msg}`);
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
