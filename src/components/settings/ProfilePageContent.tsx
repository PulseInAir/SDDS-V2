"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, KeyRound, Loader2, ShieldAlert, User, Users } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  updateProfileDetailsAction,
  updateProfilePasswordAction,
  updateProfileImageAction,
  type ProfileActionState,
} from "@/lib/actions/profile";
import type { AuthenticatedWorkspaceSession } from "@/lib/auth/session";

const initialState: ProfileActionState = {};

export function ProfilePageContent({
  session,
}: {
  session: AuthenticatedWorkspaceSession;
}) {
  const router = useRouter();
  
  // Forms states
  const [detailsState, detailsFormAction, isDetailsPending] = useActionState(
    updateProfileDetailsAction,
    initialState
  );
  const [passwordState, passwordFormAction, isPasswordPending] = useActionState(
    updateProfilePasswordAction,
    initialState
  );
  const [imageState, imageFormAction, isImagePending] = useActionState(
    updateProfileImageAction,
    initialState
  );

  // Profile image local states
  const [previewUrl, setPreviewUrl] = useState<string | null>(session.user.avatarUrl);
  const [base64Data, setBase64Data] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (detailsState.success || imageState.success) {
      router.refresh();
      if (imageState.success) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setBase64Data(null);
      }
    }
  }, [router, detailsState.success, imageState.success]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image must be smaller than 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreviewUrl(result);
        setBase64Data(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCancelImage = () => {
    setPreviewUrl(session.user.avatarUrl);
    setBase64Data(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <section className="rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">Admin Profile</h1>
            <p className="mt-1 text-sm text-text-muted">
              Manage your personal credentials, profile avatar, security credentials, and view workspace memberships.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge variant="info">{session.workspace.name}</StatusBadge>
            <StatusBadge variant="success">Role: {session.membership.role}</StatusBadge>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="space-y-6">
          {/* Edit Profile Details */}
          <form action={detailsFormAction} className="space-y-4 rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3 border-b border-border-subtle pb-3">
              <div>
                <h2 className="text-base font-semibold text-text-primary">Profile details</h2>
                <p className="mt-1 text-sm text-text-muted">
                  Update your contact details and active name in the workspace.
                </p>
              </div>
              <User className="h-5 w-5 text-text-muted" aria-hidden="true" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Full Name"
                name="fullName"
                defaultValue={session.user.fullName ?? ""}
                required
              />
              <TextField
                label="Email address"
                name="email"
                type="email"
                defaultValue={session.user.email ?? ""}
                required
              />
            </div>

            {detailsState.error ? (
              <p className="rounded-[var(--radius-input)] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {detailsState.error}
              </p>
            ) : null}

            {detailsState.success ? (
              <p className="rounded-[var(--radius-input)] border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                {detailsState.success}
              </p>
            ) : null}

            <div className="flex justify-end">
              <Button type="submit" disabled={isDetailsPending}>
                {isDetailsPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                Save details
              </Button>
            </div>
          </form>

          {/* Password Change */}
          <form action={passwordFormAction} className="space-y-4 rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3 border-b border-border-subtle pb-3">
              <div>
                <h2 className="text-base font-semibold text-text-primary">Change password</h2>
                <p className="mt-1 text-sm text-text-muted">
                  Ensure your account uses a long, random password to stay secure.
                </p>
              </div>
              <KeyRound className="h-5 w-5 text-text-muted" aria-hidden="true" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="New password"
                name="password"
                type="password"
                required
              />
              <TextField
                label="Confirm new password"
                name="confirmPassword"
                type="password"
                required
              />
            </div>

            {passwordState.error ? (
              <p className="rounded-[var(--radius-input)] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {passwordState.error}
              </p>
            ) : null}

            {passwordState.success ? (
              <p className="rounded-[var(--radius-input)] border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                {passwordState.success}
              </p>
            ) : null}

            <div className="flex justify-end">
              <Button type="submit" disabled={isPasswordPending}>
                {isPasswordPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                Change password
              </Button>
            </div>
          </form>

          {/* User Management Section */}
          <section className="rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3 border-b border-border-subtle pb-3">
              <div>
                <h2 className="text-base font-semibold text-text-primary">User management</h2>
                <p className="mt-1 text-sm text-text-muted">
                  View and manage users authorized to access this workspace.
                </p>
              </div>
              <Users className="h-5 w-5 text-text-muted" aria-hidden="true" />
            </div>

            <div className="mt-4 space-y-4">
              <div className="rounded-[var(--radius-input)] border border-amber-200 bg-amber-50 p-4 text-amber-900">
                <div className="flex gap-2">
                  <ShieldAlert className="h-5 w-5 flex-shrink-0 text-amber-700" />
                  <div>
                    <h4 className="font-semibold text-amber-800">Workspace User Management Blocked</h4>
                    <p className="mt-1 text-sm text-amber-700">
                      Multi-user access is currently restricted as per workspace decision **D-012**. The workspace operates under a single-owner membership model.
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto rounded-[var(--radius-input)] border border-border-subtle">
                <table className="min-w-full divide-y divide-border-subtle text-sm">
                  <thead className="bg-surface-muted text-text-secondary">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left font-semibold">User</th>
                      <th scope="col" className="px-4 py-3 text-left font-semibold">Role</th>
                      <th scope="col" className="px-4 py-3 text-left font-semibold">Status</th>
                      <th scope="col" className="px-4 py-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle bg-surface-panel">
                    <tr>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-xs uppercase">
                            {session.user.fullName?.slice(0, 2) || "U"}
                          </div>
                          <div>
                            <div className="font-medium text-text-primary">{session.user.fullName || "Owner"}</div>
                            <div className="text-xs text-text-muted">{session.user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-text-secondary capitalize">
                        {session.membership.role}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <StatusBadge variant="success">Active</StatusBadge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <span className="text-xs text-text-muted italic">Owner accounts cannot be deleted</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-2">
                <Button disabled variant="secondary">Invite user</Button>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar panels */}
        <div className="space-y-6">
          {/* Profile Image card */}
          <section className="rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel p-5 shadow-sm text-center">
            <h2 className="text-base font-semibold text-text-primary text-left border-b border-border-subtle pb-3 mb-4">
              Profile image
            </h2>

            <div className="flex flex-col items-center justify-center gap-4">
              <div className="relative group">
                <div className="h-24 w-24 rounded-full border border-border-subtle overflow-hidden bg-surface-muted flex items-center justify-center">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Avatar preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-12 w-12 text-text-muted" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 rounded-full bg-brand-600 p-2 text-white hover:bg-brand-700 shadow-md transition-colors"
                  aria-label="Upload photo"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />

              <div className="text-xs text-text-muted max-w-xs">
                Upload a JPEG or PNG image. Recommended size is 256x256px, max 2MB.
              </div>

              {base64Data && (
                <form action={imageFormAction} className="flex gap-2">
                  <input type="hidden" name="avatarUrl" value={base64Data} />
                  <Button type="submit" size="sm" disabled={isImagePending}>
                    {isImagePending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
                    Save image
                  </Button>
                  <Button type="button" variant="secondary" size="sm" onClick={handleCancelImage} disabled={isImagePending}>
                    Cancel
                  </Button>
                </form>
              )}

              {imageState.error ? (
                <p className="text-xs text-red-600 mt-2">{imageState.error}</p>
              ) : null}

              {imageState.success ? (
                <p className="text-xs text-green-600 mt-2">{imageState.success}</p>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
