# MRTX — go-live checklist

Work top to bottom. Do not skip ahead: each stage assumes the one above
worked. Every stage ends with **CHECK** — if that check fails, stop and
fix it before moving on.

Nothing here can take real money until Stage 9. Until then you can break
things freely.

---

## Stage 1 — push the code

```bash
cd "/Users/jacin/Documents/Design Work/mrtx-club"
git push
```

**CHECK** — open <https://github.com/jacejacob1/mrtx-store>. You should
see folders (`src`, `public`) and a README, not "This repository is
empty".

---

## Stage 2 — get your Supabase key

Your database already exists. You need one secret from it.

1. Go to <https://supabase.com/dashboard/project/aywsimktbphyksmykrvg/settings/api-keys>
2. Find the **`service_role`** key (it may be under "Legacy API keys", or
   shown as a **secret key** starting `sb_secret_`). Either works.
3. Click reveal, then copy it.

Paste it somewhere temporary — a note you'll delete. You'll need it in
Stage 4.

> **This key can read and write every order and address you will ever
> have.** Never put it in a message, a screenshot, or the code. It only
> ever goes into Vercel's environment variables.

**CHECK** — it's a long string. If it starts `sb_publishable_` or
`eyJ...anon`, that's the wrong one; you want `service_role` / `sb_secret_`.

---

## Stage 3 — get your Razorpay TEST keys

We use test keys first. Test keys cannot move real money — that is
exactly why we start here.

1. Go to <https://dashboard.razorpay.com/>
2. Top-left, switch the mode toggle to **Test Mode**. Confirm it says
   Test before continuing.
3. **Account & Settings → API Keys → Generate Test Key**
4. You get a **Key Id** (starts `rzp_test_`) and a **Key Secret**. The
   secret is shown **once** — copy both now.

Also invent a **webhook secret**. It's just a password you make up, used
to prove a message really came from Razorpay. Any long random string:

```
mrtx_whsec_7f3a91c4e8b25d06
```

Write down all three.

**CHECK** — your Key Id starts with `rzp_test_`, not `rzp_live_`.

---

## Stage 4 — create the Vercel project

1. Go to <https://vercel.com/new>
2. Find **mrtx-store** and click **Import**.
   If it isn't listed: **Adjust GitHub App Permissions** → grant access
   to the repo.
3. **Do not change any build settings.** Next.js is detected
   automatically.
4. Before clicking Deploy, expand **Environment Variables** and add these
   **nine**, one at a time:

| Name | Value |
|---|---|
| `RAZORPAY_KEY_ID` | your `rzp_test_...` id |
| `RAZORPAY_KEY_SECRET` | the test secret |
| `RAZORPAY_WEBHOOK_SECRET` | the string you invented |
| `NEXT_PUBLIC_PAYMENTS_LIVE` | `0` |
| `SUPABASE_URL` | `https://aywsimktbphyksmykrvg.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | the key from Stage 2 |
| `SHIPROCKET_EMAIL` | leave blank for now |
| `SHIPROCKET_PASSWORD` | leave blank for now |
| `SHIPROCKET_PICKUP_LOCATION` | `Primary` |

Note `NEXT_PUBLIC_PAYMENTS_LIVE` is **`0`** — the site will say plainly
that payment isn't connected. That's deliberate.

5. **Do not add a domain.** Skip anything asking about `mrtx.club`.
6. Click **Deploy** and wait.

**CHECK** — you get a URL like `mrtx-store-xxxx.vercel.app`. Open it. The
home page cuts between eight images. `/shop/origin` shows the black
product page at ₹699.

> If the build fails, open the log and send me the last 20 lines.

---

## Stage 5 — protect your launch page

Your coming-soon page must keep serving `mrtx.club` until the 14th.

1. In Vercel, open your **older** project (the one serving
   `mrtx-club.vercel.app`).
2. **Settings → Domains.** Note whether `mrtx.club` is listed there.

**CHECK** — `mrtx.club` should still show the coming-soon page with the
countdown. Open it in a private window to be sure.

If `mrtx.club` is attached to the project you just created, remove it
from there immediately — otherwise your launch page is already gone.

---

## Stage 6 — connect the webhook

This is the step people skip, and it's the one that makes paid orders
actually ship. Without it, someone pays and nothing happens.

1. Razorpay dashboard, still in **Test Mode**
2. **Account & Settings → Webhooks → Add New Webhook**
3. **Webhook URL** — your Vercel URL plus the path:
   ```
   https://mrtx-store-xxxx.vercel.app/api/webhooks/razorpay
   ```
4. **Secret** — the webhook secret you invented in Stage 3. It must match
   exactly.
5. **Active Events** — tick **`payment.captured`**. That one is required.
   You may also tick `payment.failed`.
6. **Create Webhook**

**CHECK** — the webhook appears in the list marked Active.

---

## Stage 7 — turn payments on, in test mode

1. Vercel → your new project → **Settings → Environment Variables**
2. Edit `NEXT_PUBLIC_PAYMENTS_LIVE` and change `0` to `1`
3. **Deployments** tab → the top one → **⋯ → Redeploy**

> Vercel does **not** pick up an environment variable change on its own.
> You must redeploy. This catches everybody once.

**CHECK** — on `/checkout`, the note saying razorpay is not connected is
gone.

---

## Stage 8 — place a test order

Now the real test. This uses fake money.

1. Open your Vercel URL → `/shop/origin`
2. Pick a size → **add to cart** → **cart** → **checkout**
3. Fill in the form with **your own real address** — you'll want to see
   what a genuine order looks like
4. Click **pay ₹699**. The Razorpay window opens.
5. Choose **Card** and use Razorpay's test card:
   - Number `4111 1111 1111 1111`
   - Any future expiry, e.g. `12/30`
   - Any CVV, e.g. `123`
   - Any name
   - On the OTP screen, click **Success**

   Current test card details: <https://razorpay.com/docs/payments/payments/test-card-details/>

**CHECK — all four, in order:**

1. You land on a page saying **access granted** with an order number
2. Razorpay dashboard → **Transactions** shows a captured payment
3. Supabase → <https://supabase.com/dashboard/project/aywsimktbphyksmykrvg/editor>
   → `orders` table → your order exists with **status = `paid`**
4. `stock` table → your size has gone **down by one**

If status is stuck at `created`, the webhook isn't reaching you. Razorpay
→ Webhooks → click yours → check recent deliveries for the error.

**Do not continue until all four pass.**

---

## Stage 9 — Shiprocket

1. Sign up at <https://www.shiprocket.in/> and complete KYC (this takes
   a day or two — start it early)
2. **Settings → Pickup Addresses** — add where you ship from. Note the
   nickname exactly.
3. **Settings → API → Configure → Create an API User.** Use a separate
   email and password for this, not your dashboard login — an API user
   can be revoked without locking you out.
4. Vercel → Environment Variables → fill in:
   - `SHIPROCKET_EMAIL` — the API user's email
   - `SHIPROCKET_PASSWORD` — the API user's password
   - `SHIPROCKET_PICKUP_LOCATION` — the nickname from step 2, **exactly**
5. Redeploy.
6. Place another test order.

**CHECK** — the `orders` row now has a `shiprocket_order_id`, and the
order appears in your Shiprocket dashboard. If `shiprocket_error` has
text in it, that message says what's wrong — usually the pickup location
name not matching.

---

## Stage 10 — your legal details

Required before real money. You're GST-registered, so the tax invoice is
legally yours.

Edit `src/lib/legal.ts` and replace every `TODO`:

- `legalName` — your registered business name
- `gstin` — your 15-character GSTIN
- `address` — principal place of business, as registered
- `state`, `phone`, `jurisdiction`

Then:

```bash
cd "/Users/jacin/Documents/Design Work/mrtx-club"
git add -A
git commit -m "Add legal entity details"
git push
```

**CHECK** — the DRAFT banner is gone from `/policies/terms`, and your
GSTIN appears there.

> Have someone who knows Indian consumer law read the four policy pages.
> I drafted them; I'm not a lawyer.

---

## Stage 11 — switch to live keys

Only when Stages 8 and 9 have passed.

1. Razorpay → switch to **Live Mode** (needs completed KYC)
2. Generate **Live** API keys
3. Create a **second webhook**, in Live Mode, same URL and same secret.
   Test and Live webhooks are separate — this catches people.
4. Vercel → update `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to the
   live values
5. Redeploy

**CHECK** — buy one tee yourself with a real card. Confirm it appears in
Razorpay Live, in Supabase, and in Shiprocket. Then refund it from the
Razorpay dashboard.

Reset the stock you consumed while testing — Supabase → `stock` → edit
`on_hand` back to 8 / 18 / 22 / 14 / 6.

---

## Stage 12 — launch day, 14 August

Do this at noon IST, not before.

1. Vercel → **old** project → Settings → Domains → **remove** `mrtx.club`
2. Vercel → **mrtx-store** → Settings → Domains → **add** `mrtx.club`
   (and `www.mrtx.club`)
3. Razorpay → Webhooks → edit the **Live** webhook URL to
   `https://mrtx.club/api/webhooks/razorpay`

**CHECK** — `mrtx.club` shows the store. Place one real order and refund
it.

**To undo:** move the domain back to the old project. It takes about a
minute.

---

## If something breaks

| Symptom | Where to look |
|---|---|
| Build fails | Vercel → Deployments → the failed one → build log |
| Page errors when live | Vercel → your project → **Logs** |
| Paid but no order row | Razorpay → Webhooks → recent deliveries |
| Order stuck at `created` | Same — the webhook isn't arriving |
| No Shiprocket shipment | Supabase → `orders` → `shiprocket_error` |
| Wrong amount charged | Should be impossible; the server computes it. Tell me. |

Send me the exact error text. Screenshots of dashboards are fine —
**never** screenshot a key or secret.
