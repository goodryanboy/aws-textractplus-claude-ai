# Trakie — Cannabis Invoice OCR Pipeline

A Next.js application for dispensary staff to upload cannabis invoices, extract product data via AWS Textract, refine with Claude AI, and sync to METRC (compliance) and Dutchie (POS).

## Features

- **AWS Textract OCR** — Extracts line items (name, SKU, quantity, price) from invoices
- **Claude AI** — Intelligent parsing, normalization, and SKU inference
- **METRC Integration** — Cannabis compliance sync (mock/demo mode without credentials)
- **Dutchie Integration** — POS inventory sync (mock/demo mode without credentials)
- **Premium Dashboard** — Dark theme, editable verification table, toast notifications

## Tech Stack

- Next.js 16, TypeScript, Tailwind CSS, Material UI, Zod

## Getting Started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `AWS_ACCESS_KEY_ID` | For real OCR | AWS credentials for Textract |
| `AWS_SECRET_ACCESS_KEY` | For real OCR | AWS credentials |
| `AWS_REGION` | No | Default: `us-west-2` |
| `ANTHROPIC_API_KEY` | For Claude | Anthropic API key |
| `UPSTASH_REDIS_REST_URL` | For rate limit | Upstash Redis URL (or `KV_REST_API_URL`) |
| `UPSTASH_REDIS_REST_TOKEN` | For rate limit | Upstash Redis token (or `KV_REST_API_TOKEN`) |
| `METRC_VENDOR_KEY` | For METRC | METRC vendor API key |
| `METRC_USER_KEY` | For METRC | METRC user API key |
| `DUTCHIE_LOCATION_KEY` | For Dutchie | Dutchie location key |
| `DUTCHIE_INTEGRATOR_KEY` | For Dutchie | Dutchie integrator key |

**Demo mode:** Without AWS/Anthropic keys, the app returns sample invoice data for presentation.

**OCR rate limit:** Max 30 requests. Add Redis (Upstash or Vercel KV) via Vercel Marketplace for persistent limit on deploy. Without Redis, uses in-memory counter (resets on cold start).

## Project Structure

```
src/
├── app/
│   ├── api/ocr/      # AWS Textract
│   ├── api/parse/    # Claude refinement
│   ├── api/metrc/    # METRC sync
│   └── api/dutchie/  # Dutchie sync
├── components/      # UploadZone, DataVerificationTable, etc.
├── lib/             # textract, claude, metrc, dutchie clients
└── types/
```
