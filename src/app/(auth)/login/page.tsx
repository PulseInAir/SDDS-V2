import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  const params = await searchParams;
  const membershipError = params?.error === "workspace-membership-required";

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-app p-6">
      <section className="w-full max-w-md glow-card p-8 rounded-[var(--radius-panel)]">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-500">
          Single Digit Data Solutions
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-text-primary">
          Sign in to SDDS
        </h1>
        <p className="mt-2 text-sm leading-6 text-text-muted">
          Internal access only. Your workspace membership is verified after authentication.
        </p>
        {membershipError ? (
          <p className="mt-4 rounded-lg bg-amber-950/40 border border-amber-900/30 px-3 py-2 text-sm text-amber-300" role="alert">
            Your login is valid, but no active SDDS workspace membership was found.
          </p>
        ) : null}
        <div className="mt-6">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
