import Link from "next/link";
import { CONFIG } from "@/lib/config";

const COLUMNS = [
  {
    head: "SHOP",
    links: [
      { href: "/shop", label: "all pieces" },
      { href: "/lookbook", label: "lookbook" },
      { href: "/about", label: "about" },
    ],
  },
  {
    head: "HELP",
    links: [
      { href: "/policies/shipping", label: "shipping" },
      { href: "/policies/returns", label: "returns and exchanges" },
      { href: "/policies/terms", label: "terms" },
      { href: "/policies/privacy", label: "privacy" },
    ],
  },
] as const;

/**
 * §13: lowercase for sentences, UPPERCASE for labels and system
 * readouts. Terse. Never explains itself. No social icons — §10 bans
 * an icon package and there is nothing here worth inlining SVG for yet.
 */
export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid max-w-[1180px] gap-10 px-5 py-14 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="label text-mute">MRTX CLUB</p>
          <p className="mt-3 max-w-[34ch] text-[14px] text-ink">
            a design brand like nothing.
          </p>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.head}>
            <p className="label text-mute">{col.head}</p>
            <ul className="mt-3 space-y-2">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-[14px] text-ink transition-opacity duration-250 hover:opacity-60"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-5">
        <p className="label text-mute">
          © {new Date().getFullYear()} MRTX CLUB
        </p>
        <p className="label text-mute">
          {CONFIG.DOMAIN.replace("https://", "")} / IDX 001 / SS26
        </p>
      </div>
    </footer>
  );
}

export default Footer;
