# Helix Peptides — research peptides storefront

A fast, self-contained, **static** storefront modeled on echopeptides.co:
dark research-lab aesthetic, product catalog with COA badges, a working
client-side cart (saved in the browser), category filtering, and a
researcher/age-verification gate. No framework, no build step.

```
helix-peptides/
├─ index.html     ← all markup / sections
├─ styles.css     ← design system (colors, layout, responsive)
├─ app.js         ← catalog data + cart + gate + interactions
├─ netlify.toml   ← Netlify config (headers, no build)
└─ README.md      ← this file
```

---

## Deploy to Netlify

**Option A — drag & drop (fastest)**
1. Go to <https://app.netlify.com/drop>
2. Drag the whole **`helix-peptides`** folder onto the page.
3. Done — Netlify gives you a live URL. Rename the site in *Site settings → Change site name*.

**Option B — from Git (auto-deploys on every push)**
1. Push this folder to a GitHub repo.
2. In Netlify: *Add new site → Import from Git* → pick the repo.
3. Build command: *(leave empty)* · Publish directory: `.`

To use a custom domain, add it in *Domain settings* and point your DNS as Netlify instructs.

---

## Rebrand it (make it the client's store)

Everything is plain text — search & replace:

| Change | Where |
|---|---|
| Brand name | `app.js` → `BRAND`; `index.html` → "Helix Peptides" everywhere |
| Support email | `app.js` → `SUPPORT_EMAIL`; footer links in `index.html` |
| Logo | the inline `<svg>` helix marks in `index.html` (search `logo-mark`) |
| Colors | `styles.css` → `:root` variables (`--accent`, `--bg`, …) |
| Products / prices | `app.js` → `PRODUCTS` array |
| Address / legal | footer in `index.html` |
| Announcement bar | `.ticker` in `index.html` |

Add a product: copy one line in the `PRODUCTS` array and set
`id`, `name`, `cat` (`peptides` / `blends` / `bac`), `price`, `coa`
(`true` published · `false` pending · `null` not applicable) and `hue`
(0–360, tints the vial).

---

## Admin panel = the Telegram bot (`helix-admin-bot`)

Products, the payment account, and orders are managed from a **Telegram bot**,
not from code. The bot writes to **Firebase Firestore**; this website reads it
live and writes each checkout as an order the bot can see and mark.

- **Before Firebase is connected:** the site runs on the built-in demo catalog
  (works out of the box — great for the first Netlify deploy).
- **After you paste your Firebase web config** into `app.js` (the
  `firebaseConfig` block near the top) and redeploy: products + the payment
  account come live from Firestore, and checkout creates real orders.

Full setup — Firebase project, security rules, and deploying the bot to Railway —
is in **`../helix-admin-bot/README.md`**.

**Newsletter + contact — Netlify Forms (optional)**
Add `netlify` to the `<form>` tag (and a hidden `form-name` input) so Netlify
captures submissions — see <https://docs.netlify.com/forms/setup/>. Or point the
form `action` at a [Formspree](https://formspree.io) endpoint.

**COA downloads**
The `COA ↓` buttons are placeholders. Drop PDF files in a `/coa` folder and
link them from each product, or point them at your COA library.

---

## Compliance note

This template keeps the reference site's "for laboratory research use only"
framing, the researcher-verification gate, and the FDA disclaimer. Make sure
the final copy, claims, shipping, and payment setup match the laws that apply
to the client's business and their payment processor's rules before going live.
