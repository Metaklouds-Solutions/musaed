# Mosaed (مساعد)

AI receptionist & admin assistant landing page for medical clinics in Saudi Arabia.

## Features

- **Bilingual**: Arabic (RTL) and English (LTR) with language toggle
- **Conversion-optimized**: Single CTA, WhatsApp FAB, 4-field form
- **Saudi market**: Copy and design tailored for dental & medical clinics
- **Brand colors**: Medical Teal (#1F7A8C), Soft Mint (#C7EDE6), Warm Sand (#EADBC8)

## Tech Stack

- Next.js 16 (App Router)
- React 19
- Tailwind CSS v4
- TypeScript

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you will be redirected to `/ar` (Arabic by default). Use `/en` for English.

## Project Structure

- `src/app/[locale]/` — Locale-specific layout and landing page
- `src/components/` — Reusable UI components
- `src/dictionaries/` — Copy in `en.json` and `ar.json`
- `middleware.ts` — Locale detection and redirect (default: Arabic)

## Configuration

- **WhatsApp**: Update `WHATSAPP_NUMBER` in `FinalCTA.tsx` and `WhatsAppFAB.tsx`
- **Form**: The demo form currently shows a success state; connect to your backend or form service
