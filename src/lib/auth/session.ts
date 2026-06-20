import "server-only";

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthenticatedWorkspaceSession = {
  user: {
    id: string;
    email: string | null;
    fullName: string | null;
    avatarUrl: string | null;
  };
  workspace: {
    id: string;
    name: string;
  };
  membership: {
    role: "owner";
  };
};

export async function getAuthenticatedWorkspaceSession(): Promise<AuthenticatedWorkspaceSession> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: membership, error: membershipError } = await supabase
    .from("workspace_members")
    .select("role, workspaces(id, name)")
    .eq("user_id", user.id)
    .eq("active", true)
    .single();

  if (membershipError || !membership?.workspaces) {
    redirect("/login?error=workspace-membership-required");
  }

  const workspace = Array.isArray(membership.workspaces)
    ? membership.workspaces[0]
    : membership.workspaces;

  if (!workspace) {
    redirect("/login?error=workspace-membership-required");
  }

  return {
    user: {
      id: user.id,
      email: user.email ?? null,
      fullName: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
      avatarUrl: user.user_metadata?.avatar_url ?? null,
    },
    workspace: {
      id: workspace.id,
      name: workspace.name,
    },
    membership: {
      role: membership.role as "owner",
    },
  };
}
