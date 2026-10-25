# Prompts for the redesign project

Two prompts. The first one starts the project. The second is what you paste at
the top of every session after that.

---

## 1. THE KICKOFF PROMPT

Paste this as your very first message in the new project, once `CLAUDE.md` and
the existing site folder are both in place.

---

You are rebuilding **MRTX CLUB** — an Indian design brand launching 14 August
2026 — as a full e-commerce site.

Read `CLAUDE.md` in the project root **first and completely**. It is the design
system and the build rules, written from a page that is already live in
production. It is not a suggestion document. Where it states a rule, follow it;
where you want to deviate, say so and give your reasoning before you write code.

Two rules from it matter more than the rest, and they apply from your very first
response:

1. **Every change ends with a changelog and ready-to-paste git commands.** Use
   the template in §0.
2. **Verify before you claim.** Run the typechecker, compute contrast rather
   than judging it by eye, check the breakpoints. If you cannot verify
   something, say so plainly instead of assuming.

### What exists

- The current site is in this folder. It is the **old design** and is being
  fully replaced. Treat it as a source of content and data, not of design or
  markup. Nothing in its CSS survives.
- The live coming-soon page is at `github.com/jacejacob1/mrtx-club` and at
  `mrtx-club-jacin-jacobs-projects.vercel.app`. **That page is the reference
  build** — it is the design system working correctly. Look at it before you
  design anything.
- The ten material textures and the paper-grain tile need copying from that
  repo into `public/assets/`. `CLAUDE.md` §15 lists exactly what.

### Target

Next.js (App Router) + Tailwind + TypeScript, deployed on Vercel.

Scope: **shop** (product grid, product detail, cart, checkout), **lookbook**
(editorial/gallery), **about** (brand story). Plus home and 404.

### Do not start coding yet

Your first job is an audit and a plan. In your first response, give me:

1. **What's actually in the existing folder** — stack, dependencies, routes,
   components, where product data lives and what shape it's in, anything
   genuinely worth keeping (data, copy, product photography — almost certainly
   not markup or styles).
2. **Anything in the existing site that conflicts with `CLAUDE.md`** and how you
   propose to resolve it.
3. **A build order** — phases, with what ships at the end of each. I want to see
   something real running early, not a big-bang reveal.
4. **The questions you need answered before starting**, in one batch. Product
   catalogue, payment provider, inventory, shipping, image assets, domain —
   whatever you actually need. Ask them all now rather than drip-feeding them.
5. **What you think is risky** about this plan.

Do not write application code in this first response.

### How I want you to work after that

- Small, reviewable steps. One concern per commit.
- Show me the result at each phase — a running route beats a description.
- Tell me when something in `CLAUDE.md` is making the build worse. It was
  written from one landing page; a store has needs that page didn't. I would
  rather update the spec than have you quietly work around it.
- When a decision is genuinely 50/50, take the quieter option and note it in the
  changelog.

---

## 2. THE SESSION PROMPT

Paste this at the start of every later session. Agents lose the plot on long
projects; this pulls them back.

---

Re-read `CLAUDE.md` before you do anything. The two standing rules are in
effect: every change ends with a changelog plus git push commands, and you
verify before you claim something works.

Tell me where the project currently stands and what you think the next step is,
then wait for me to confirm before you start.

---

## 3. USEFUL FOLLOW-UPS

Keep these around — they're the prompts that catch problems early.

**Before shipping any page**
> Audit this page against `CLAUDE.md`. Check contrast by computing it, check all
> four breakpoints, check keyboard navigation and `prefers-reduced-motion`.
> Report what fails, don't fix it yet.

**When something looks wrong but produces no error**
> Read `CLAUDE.md` §12 before debugging. Five things in this system fail
> silently with no console error — check those first.

**When the design drifts**
> Compare this against the live coming-soon page. Where has it drifted from the
> system, and is each drift deliberate or accidental?

**When it starts adding things**
> `CLAUDE.md` §16: when in doubt, remove it. What can come off this page without
> losing anything?

**Before a launch push**
> Full pre-flight: typecheck, lint, build, Lighthouse, the performance budget in
> §10, and every gotcha in §12. Report actual numbers, not assurances.
