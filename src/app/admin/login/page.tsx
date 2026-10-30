import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Wordmark } from "@/components/Wordmark";
import { DotText } from "@/components/DotText";
import { LoginForm } from "@/components/admin/LoginForm";
import { currentAdmin } from "@/lib/server/admin-auth";
import { hasDb } from "@/lib/server/env";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (hasDb() && (await currentAdmin())) redirect("/admin");

  return (
    <main id="main" className="flex min-h-[100svh] items-center justify-center px-5">
      <div className="w-full max-w-[380px]">
        <div className="flex items-center justify-between">
          <Wordmark className="h-[14px] w-auto text-fg" />
          <DotText text="ADMIN" size={10} label="Admin" className="text-fg-2" />
        </div>
        <h1 className="t-headline mt-14">Sign in.</h1>
        <p className="t-body mt-2 text-fg-2">For the MRTX team only.</p>
        {hasDb() ? (
          <LoginForm />
        ) : (
          <p className="t-small mt-10 rounded-2xl bg-surface p-4 text-fg-2">
            The database isn&apos;t configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local.
          </p>
        )}
      </div>
    </main>
  );
}
