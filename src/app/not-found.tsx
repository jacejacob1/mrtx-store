import Link from "next/link";
import { DotText } from "@/components/DotText";

/** No signal. The matrix powers on, finds nothing, and offers a way back. */
export default function NotFound() {
  return (
    <section
      data-ground="dark"
      className="flex min-h-[100svh] flex-col items-center justify-center gap-10 px-6 text-center"
    >
      <DotText text="404" size={96} ghost boot bootMs={900} label="404" />
      <div>
        <h1 className="t-headline">No signal.</h1>
        <p className="t-body mt-3 text-fg-2">That page isn&apos;t here — or isn&apos;t here yet.</p>
      </div>
      <Link
        href="/"
        className="t-body rounded-full bg-fg px-6 py-3 font-semibold text-bg transition-transform duration-300 hover:scale-[1.03]"
      >
        Back to MRTX
      </Link>
    </section>
  );
}
