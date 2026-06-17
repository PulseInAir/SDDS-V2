"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { getAuthenticatedWorkspaceSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createAssessmentYearSchema } from "@/lib/validations/settings";

const ACTIVE_AY_COOKIE = "sdds_active_assessment_year";
const PRIVACY_MODE_COOKIE = "sdds_privacy_mode";

export type SettingsActionState = {
  error?: string;
  success?: string;
};

type AssessmentYearRow = {
  id: string;
  label: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  is_open: boolean;
};

function parseCheckbox(value: FormDataEntryValue | null) {
  return value === "true" || value === "on";
}

function privacyCookieToBoolean(value: string | undefined) {
  return value !== "off";
}

async function getAssessmentYears(workspaceId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("assessment_years")
    .select("id, label, start_date, end_date, is_current, is_open")
    .eq("workspace_id", workspaceId)
    .order("start_date", { ascending: false });

  if (error) {
    throw new Error(`Failed to load assessment years: ${error.message}`);
  }

  return (data ?? []) as AssessmentYearRow[];
}

export async function getShellContextData(workspaceId: string) {
  const cookieStore = await cookies();
  const assessmentYears = await getAssessmentYears(workspaceId);
  const cookieAssessmentYearId = cookieStore.get(ACTIVE_AY_COOKIE)?.value;
  const selectedAssessmentYearId =
    assessmentYears.find((assessmentYear) => assessmentYear.id === cookieAssessmentYearId)?.id ??
    assessmentYears.find((assessmentYear) => assessmentYear.is_current)?.id ??
    assessmentYears[0]?.id ??
    null;

  return {
    assessmentYears,
    selectedAssessmentYearId,
    isPrivacyMode: privacyCookieToBoolean(cookieStore.get(PRIVACY_MODE_COOKIE)?.value),
  };
}

export async function getSettingsPageData() {
  const session = await getAuthenticatedWorkspaceSession();
  const supabase = await createSupabaseServerClient();
  const shell = await getShellContextData(session.workspace.id);

  const [{ data: invoiceSequences, error: invoiceSequencesError }, { count: invoiceCount, error: invoiceCountError }] =
    await Promise.all([
      supabase
        .from("invoice_sequences")
        .select("assessment_year_id, next_serial")
        .eq("workspace_id", session.workspace.id),
      supabase
        .from("invoices")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", session.workspace.id)
        .is("archived_at", null),
    ]);

  if (invoiceSequencesError) {
    throw new Error(`Failed to load invoice sequencing data: ${invoiceSequencesError.message}`);
  }

  if (invoiceCountError) {
    throw new Error(`Failed to load invoice summary data: ${invoiceCountError.message}`);
  }

  const sequenceMap = new Map(
    (invoiceSequences ?? []).map((row) => [row.assessment_year_id, row.next_serial]),
  );

  return {
    workspace: session.workspace,
    invoiceCount: invoiceCount ?? 0,
    shell,
    assessmentYears: shell.assessmentYears.map((assessmentYear) => ({
      ...assessmentYear,
      nextInvoiceSerial: sequenceMap.get(assessmentYear.id) ?? 1,
    })),
  };
}

export async function setAssessmentYearPreferenceAction(assessmentYearId: string) {
  const session = await getAuthenticatedWorkspaceSession();
  const supabase = await createSupabaseServerClient();
  const cookieStore = await cookies();

  if (!assessmentYearId) {
    cookieStore.delete(ACTIVE_AY_COOKIE);
    return;
  }

  const { data, error } = await supabase
    .from("assessment_years")
    .select("id")
    .eq("workspace_id", session.workspace.id)
    .eq("id", assessmentYearId)
    .single();

  if (error || !data) {
    throw new Error("Selected assessment year is not available in the active workspace.");
  }

  cookieStore.set(ACTIVE_AY_COOKIE, assessmentYearId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function setPrivacyModePreferenceAction(isPrivacyMode: boolean) {
  const cookieStore = await cookies();

  cookieStore.set(PRIVACY_MODE_COOKIE, isPrivacyMode ? "on" : "off", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function createAssessmentYearAction(
  _previousState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const session = await getAuthenticatedWorkspaceSession();
  const supabase = await createSupabaseServerClient();

  const parsed = createAssessmentYearSchema.safeParse({
    label: String(formData.get("label") ?? "").trim(),
    startDate: String(formData.get("startDate") ?? "").trim(),
    endDate: String(formData.get("endDate") ?? "").trim(),
    makeCurrent: parseCheckbox(formData.get("makeCurrent")),
    isOpen: parseCheckbox(formData.get("isOpen")),
  });

  if (!parsed.success) {
    return {
      error:
        parsed.error.flatten().formErrors[0] ??
        Object.values(parsed.error.flatten().fieldErrors).flat()[0] ??
        "Assessment year validation failed.",
    };
  }

  const existingAssessmentYears = await getAssessmentYears(session.workspace.id);
  const makeCurrent = parsed.data.makeCurrent || existingAssessmentYears.length === 0;

  const previousCurrent = existingAssessmentYears.find((assessmentYear) => assessmentYear.is_current) ?? null;

  const { data: insertedAssessmentYear, error } = await supabase
    .from("assessment_years")
    .insert({
    workspace_id: session.workspace.id,
    label: parsed.data.label,
    start_date: parsed.data.startDate,
    end_date: parsed.data.endDate,
    is_current: false,
    is_open: parsed.data.isOpen || makeCurrent,
    })
    .select("id")
    .single();

  if (error || !insertedAssessmentYear) {
    return { error: `Failed to save the assessment year: ${error.message}` };
  }

  if (makeCurrent) {
    const { error: clearCurrentError } = await supabase
      .from("assessment_years")
      .update({ is_current: false })
      .eq("workspace_id", session.workspace.id)
      .eq("is_current", true);

    if (clearCurrentError) {
      return { error: `Assessment year was created, but the current-year switch failed: ${clearCurrentError.message}` };
    }

    const { error: setCurrentError } = await supabase
      .from("assessment_years")
      .update({ is_current: true })
      .eq("workspace_id", session.workspace.id)
      .eq("id", insertedAssessmentYear.id);

    if (setCurrentError) {
      if (previousCurrent) {
        await supabase
          .from("assessment_years")
          .update({ is_current: true })
          .eq("workspace_id", session.workspace.id)
          .eq("id", previousCurrent.id);
      }

      return { error: `Assessment year was created, but setting it current failed: ${setCurrentError.message}` };
    }
  }

  revalidatePath("/settings");
  return { success: `Assessment year ${parsed.data.label} was added.` };
}

export async function setCurrentAssessmentYearAction(formData: FormData) {
  const session = await getAuthenticatedWorkspaceSession();
  const supabase = await createSupabaseServerClient();
  const assessmentYearId = String(formData.get("assessmentYearId") ?? "").trim();

  if (!assessmentYearId) {
    throw new Error("Assessment year is required.");
  }

  const assessmentYears = await getAssessmentYears(session.workspace.id);
  const target = assessmentYears.find((assessmentYear) => assessmentYear.id === assessmentYearId);
  const previousCurrent = assessmentYears.find((assessmentYear) => assessmentYear.is_current) ?? null;

  if (!target) {
    throw new Error("Assessment year not found in the active workspace.");
  }

  if (!target.is_open) {
    throw new Error("Closed assessment years cannot be marked current.");
  }

  const { error: clearCurrentError } = await supabase
    .from("assessment_years")
    .update({ is_current: false })
    .eq("workspace_id", session.workspace.id)
    .eq("is_current", true);

  if (clearCurrentError) {
    throw new Error(`Failed to clear the previous current assessment year: ${clearCurrentError.message}`);
  }

  const { error: setCurrentError } = await supabase
    .from("assessment_years")
    .update({ is_current: true })
    .eq("workspace_id", session.workspace.id)
    .eq("id", assessmentYearId);

  if (setCurrentError) {
    if (previousCurrent) {
      await supabase
        .from("assessment_years")
        .update({ is_current: true })
        .eq("workspace_id", session.workspace.id)
        .eq("id", previousCurrent.id);
    }

    throw new Error(`Failed to set the current assessment year: ${setCurrentError.message}`);
  }

  revalidatePath("/settings");
}

export async function setAssessmentYearOpenStateAction(formData: FormData) {
  const session = await getAuthenticatedWorkspaceSession();
  const supabase = await createSupabaseServerClient();
  const assessmentYearId = String(formData.get("assessmentYearId") ?? "").trim();
  const nextIsOpen = parseCheckbox(formData.get("isOpen"));

  if (!assessmentYearId) {
    throw new Error("Assessment year is required.");
  }

  const assessmentYears = await getAssessmentYears(session.workspace.id);
  const target = assessmentYears.find((assessmentYear) => assessmentYear.id === assessmentYearId);

  if (!target) {
    throw new Error("Assessment year not found in the active workspace.");
  }

  if (!nextIsOpen && target.is_current) {
    throw new Error("Set another current assessment year before closing this one.");
  }

  const { error } = await supabase
    .from("assessment_years")
    .update({ is_open: nextIsOpen })
    .eq("workspace_id", session.workspace.id)
    .eq("id", assessmentYearId);

  if (error) {
    throw new Error(`Failed to update the assessment year status: ${error.message}`);
  }

  revalidatePath("/settings");
}
