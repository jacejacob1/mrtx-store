import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";
import { DotText } from "@/components/DotText";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { logoutAction } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/server/admin-auth";

export const dynamic = "force-dynamic";

/** Everything behind the login. requireAdmin() runs on every request. */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1240px] items-center justify-between gap-4 px-5">
          <div className="flex items-center gap-4">
            <Link href="/admin" aria-label="Dashboard home">
              <Wordmark className="h-[13px] w-auto text-fg" decorative />
            </Link>
            <DotText text="ADMIN" size={9} label="" className="hidden text-fg-2 sm:block" />
          </div>
          <AdminTabs />
          <div className="flex items-center gap-4">
            <Link href="/" target="_blank" className="t-small hidden text-fg-2 hover:text-fg md:inline">
              View site ↗
            </Link>
            <form action={logoutAction}>
              <button type="submit" className="t-small text-fg-2 hover:text-fg" title={admin.email}>
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-[1240px] px-5 pt-10 pb-28">
        {children}
      </main>
    </>
  );
}
