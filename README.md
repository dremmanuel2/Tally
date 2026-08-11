# Tally - 记账本

A personal finance tracking web application built with Next.js.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Auth:** NextAuth.js (Credentials)
- **Database:** MongoDB Atlas
- **ORM:** Prisma 6
- **Deploy:** Vercel

## Features

- 📊 **Dashboard** — Real-time income/expense statistics with date range & card filtering
- 💳 **Bank Card Management** — Add/edit/delete cards with per-currency setting
- 📝 **Transaction CRUD** — Create, read, update, delete transactions
- 🏷️ **Common Notes** — Save reusable note templates for quick select
- 🌐 **Multi-currency** — Support for CNY, USD, JPY, EUR, GBP, HKD, KRW, SGD, THB, MYR
- 🔐 **Authentication** — Email & password registration/login
- 🌏 **Bilingual** — Chinese & English interface

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)

### Setup

```bash
# Clone the repo
git clone <repo-url>
cd tally

# Install dependencies
npm install

# Configure environment variables
cp .env .env.local
# Edit .env.local with your MongoDB connection string and secrets

# Generate Prisma client
npx prisma generate

# Push schema to MongoDB
npx prisma db push

# Start dev server
npm run dev
```

### Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | MongoDB connection string |
| `NEXTAUTH_SECRET` | Secret for JWT encryption |
| `NEXTAUTH_URL` | App URL (http://localhost:3000 for dev) |

## Project Structure

```
src/
├── app/
│   ├── (authenticated)/  # Protected pages (dashboard, transactions, etc.)
│   ├── api/              # API routes
│   ├── login/            # Login page
│   └── register/         # Register page
├── components/
│   ├── layout/           # Sidebar, Header, AuthLayout
│   ├── SessionProvider.tsx
│   └── LocaleProvider.tsx
├── lib/
│   ├── auth.ts           # NextAuth config
│   ├── prisma.ts         # Prisma client
│   ├── i18n.ts           # i18n config
│   └── useTranslation.ts # Translation hook
├── proxy.ts              # Auth middleware
└── types/                # TypeScript types
messages/                 # Translation files (zh.json, en.json)
prisma/
└── schema.prisma         # Database schema
```

## Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Set environment variables:
   - `DATABASE_URL` — your MongoDB Atlas connection string
   - `NEXTAUTH_SECRET` — generate a random string via `openssl rand -base64 32`
   - `NEXTAUTH_URL` — your Vercel deployment URL
4. Deploy

Make sure to whitelist Vercel's IPs in MongoDB Atlas Network Access.
