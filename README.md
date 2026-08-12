# Corehold — corehold.com

The site for Corehold, an intelligent systems studio in Dubai.
One idea, held all the way through: **Corehold builds the connected system, you own it, forever.**

## Stack

- **Next.js 15** (App Router, static export — deploy the `out/` folder anywhere)
- **React 19**, TypeScript, **Tailwind CSS v4**
- Self-hosted fonts: Space Grotesk (display) + IBM Plex Mono (annotations)
- Zero runtime dependencies beyond React; ~113 kB first load

## Run it

```bash
npm install
npm run build     # builds + exports the static site to out/
npm run serve     # preview out/ locally
npm run dev       # development server
npm run og        # regenerate og.png + favicons from the vector mark
```

Set your production domain before deploying (used in metadata, sitemap, JSON-LD):

```bash
NEXT_PUBLIC_SITE_URL=https://yourdomain.com npm run build
```

(Defaults to `https://corehold.com` — change it in `lib/site.ts` if you prefer.)

## How it's put together

- `lib/convergence.ts` — the signature moment. A deterministic, scroll-scrubbed
  canvas timeline: scattered rented tools → square circuit ring → collapse into
  one core → the two brackets grip it (the logo itself) → the finished mark
  docks into the nav. Scrub backwards and it reverses perfectly.
- `components/Trade.tsx` — the "stop paying" switch: flip it and the rented
  stack flickers out while the owned core keeps running.
- `components/Demo.tsx` + `lib/demoEngine.ts` + `lib/blueprint.ts` — The Demo:
  the visitor builds their own stack, prices it with their own numbers (live
  cost counter + "burned while you've been on this page"), kills it with the
  STOP PAYING switch, then watches their tools converge into the held core,
  run a night-shift scenario for their industry, and finally downloads a
  personalized system blueprint (generated in-browser) that pre-fills the
  audit form.
- `components/Method.tsx` — the five stages with a sticky schematic that
  redraws per stage.
- `components/CursorBrackets.tsx` — the cursor is the core; the brackets never
  stop holding it. They lock onto anything interactive.
- The bracket-and-core motif runs through everything: reveals (`.held`,
  `.lockin` in `globals.css`), form focus states, the confirmation screen.

## Craft notes

- **Reduced motion**: full alternative experience — static resolved system,
  no choreography, everything readable and functional.
- **Accessibility**: semantic HTML, one h1, skip link, keyboard-operable
  switch (`role="switch"`), visible focus states, aria-live status lines,
  native cursor preserved over text fields.
- **Performance**: single canvas (paused off-screen, DPR-capped), transform/
  opacity-only CSS animation, static export, self-hosted subset fonts.
- **SEO**: meta + Open Graph + Twitter cards, JSON-LD (`ProfessionalService`),
  `sitemap.xml`, `robots.txt`, keyword-relevant copy for systems ownership /
  automation / AI in the UAE.

## The contact form

The audit-request flow is a complete front-end placeholder (validation,
submit state, held confirmation with a reference code). Wire the `onSubmit`
in `components/Contact.tsx` to your backend, form service, or an email
endpoint when ready.
