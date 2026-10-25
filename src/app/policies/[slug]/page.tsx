import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { POLICIES, policyBySlug } from "@/lib/policies";

type Params = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => POLICIES.map((p) => ({ slug: p.slug }));

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const p = policyBySlug((await params).slug);
  return p ? { title: p.title } : {};
}

export default async function PolicyPage({ params }: Params) {
  const p = policyBySlug((await params).slug);
  if (!p) notFound();

  return (
    <section data-ground="light" className="px-5 pt-32 pb-24 md:pt-40">
      <div className="mx-auto grid max-w-[1240px] gap-12 md:grid-cols-12">
        <nav aria-label="Policies" className="md:col-span-3">
          <ul className="flex flex-wrap gap-2 md:flex-col md:gap-1">
            {POLICIES.map((x) => (
              <li key={x.slug}>
                <Link
                  href={`/policies/${x.slug}`}
                  aria-current={x.slug === p.slug ? "page" : undefined}
                  className={`t-small block rounded-full px-4 py-2 md:px-0 md:py-1 ${
                    x.slug === p.slug ? "bg-fg text-bg md:bg-transparent md:text-fg md:font-semibold" : "text-fg-2 hover:text-fg"
                  }`}
                >
                  {x.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <article className="md:col-span-8">
          <p className="t-eyebrow text-accent">Draft</p>
          <h1 className="t-display mt-3">{p.title}</h1>
          <div className="mt-12 space-y-10">
            {p.sections.map((s) => (
              <section key={s.h}>
                <h2 className="t-title">{s.h}</h2>
                {s.p.map((para) => (
                  <p key={para} className="t-body mt-3 max-w-[60ch] text-fg-2">
                    {para}
                  </p>
                ))}
              </section>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
