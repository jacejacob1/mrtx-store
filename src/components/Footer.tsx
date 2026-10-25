import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";
import { DotText } from "@/components/DotText";

const COLS = [
  {
    head: "Shop",
    links: [
      { href: "/shop", label: "The drop" },
      { href: "/shop/remember", label: "Remember" },
      { href: "/shop/breathe", label: "Breathe" },
      { href: "/shop/fly-high", label: "Fly High" },
      { href: "/shop/solitude", label: "Solitude" },
      { href: "/shop/be-yourself", label: "Be Yourself" },
    ],
  },
  {
    head: "MRTX",
    links: [
      { href: "/gallery", label: "Gallery" },
      { href: "/about", label: "About" },
    ],
  },
  {
    head: "Help",
    links: [
      { href: "/policies/shipping", label: "Shipping" },
      { href: "/policies/returns", label: "Returns & refunds" },
      { href: "/policies/terms", label: "Terms" },
      { href: "/policies/privacy", label: "Privacy" },
    ],
  },
];

/** Apple's dense footer, on black, with the mark at full width. */
export function Footer() {
  return (
    <footer data-ground="dark" className="relative z-10">
      <div className="mx-auto max-w-[1240px] px-5 pt-20 pb-10">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <p className="t-title max-w-[18ch]">Five pieces. Five sentences. Cut in Tirupur.</p>
            <a
              href="mailto:hello@mrtx.club"
              className="t-small mt-4 inline-block text-fg-2 hover:text-fg"
            >
              hello@mrtx.club
            </a>
          </div>
          {COLS.map((c) => (
            <div key={c.head}>
              <p className="t-eyebrow text-fg-2">{c.head}</p>
              <ul className="mt-4 space-y-2.5">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="t-small text-fg-2 transition-colors hover:text-fg">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Wordmark decorative className="mt-24 w-full text-fg" />

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
          <p className="t-small text-fg-2">© {new Date().getFullYear()} MRTX CLUB. Made in India.</p>
          <div className="flex items-center gap-2 text-fg-2">
            <span className="live-dot" aria-hidden />
            <DotText text="SS26 / DROP 001" size={9} />
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
