"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedWorkspaceSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ProfileActionState = {
  error?: string;
  success?: string;
};

export async function updateProfileDetailsAction(
  _previousState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  try {
    const session = await getAuthenticatedWorkspaceSession();
    const supabase = await createSupabaseServerClient();

    const fullName = String(formData.get("fullName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();

    if (!fullName) {
      return { error: "Name is required." };
    }

    if (!email) {
      return { error: "Email is required." };
    }

    // Update metadata first
    const { error: metaError } = await supabase.auth.updateUser({
      data: {
        full_name: fullName,
        name: fullName,
      },
    });

    if (metaError) {
      return { error: `Failed to update name: ${metaError.message}` };
    }

    // If email has changed, update it. Note: user might need to verify new email depending on Supabase configuration
    if (email !== session.user.email) {
      const { error: emailError } = await supabase.auth.updateUser({
        email: email,
      });

      if (emailError) {
        return { error: `Failed to update email: ${emailError.message}` };
      }
      
      revalidatePath("/", "layout");
      return { success: "Profile name updated. Email change is pending verification link sent to your new email." };
    }

    revalidatePath("/", "layout");
    return { success: "Profile details updated successfully." };
  } catch (err: any) {
    return { error: err.message || "An unexpected error occurred." };
  }
}

export async function updateProfilePasswordAction(
  _previousState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  try {
    await getAuthenticatedWorkspaceSession();
    const supabase = await createSupabaseServerClient();

    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (!password) {
      return { error: "Password is required." };
    }

    if (password.length < 6) {
      return { error: "Password must be at least 6 characters long." };
    }

    if (password !== confirmPassword) {
      return { error: "Passwords do not match." };
    }

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      return { error: `Failed to change password: ${error.message}` };
    }

    return { success: "Password changed successfully." };
  } catch (err: any) {
    return { error: err.message || "An unexpected error occurred." };
  }
}

export async function updateProfileImageAction(
  _previousState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  try {
    await getAuthenticatedWorkspaceSession();
    const supabase = await createSupabaseServerClient();

    const avatarUrl = String(formData.get("avatarUrl") ?? "").trim();

    if (!avatarUrl) {
      return { error: "No profile image provided." };
    }

    const { error } = await supabase.auth.updateUser({
      data: {
        avatar_url: avatarUrl,
      },
    });

    if (error) {
      return { error: `Failed to update avatar: ${error.message}` };
    }

    revalidatePath("/", "layout");
    return { success: "Profile image updated successfully." };
  } catch (err: any) {
    return { error: err.message || "An unexpected error occurred." };
  }
}
