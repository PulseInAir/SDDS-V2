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
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
          Single Digit Data Solutions
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-950">
          Sign in to SDDS
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Internal access only. Your workspace membership is verified after authentication.
        </p>
        {membershipError ? (
          <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800" role="alert">
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
