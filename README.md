# Care4U Backend

REST API for **Care4U**, a hospital and doctor appointment booking system.

## Stack

- Node.js + Express 5, written in TypeScript (run with `tsx`)
- Prisma 7 ORM (MySQL/MariaDB) with a multi-file schema in `src/databases/models`
- Redis + BullMQ for appointment and meeting queues, workers and reminder schedulers
- JWT access/refresh tokens, Argon2 password hashing, OTP verification
- Zod request validation
- Google Calendar / Zoom integration for online consultations
- ImageKit for file uploads, PDFKit for invoice and prescription PDFs

## Project layout

```
prisma/                 Prisma entry schema
src/
  app.ts, index.ts      Express app and server bootstrap
  common/               constants, handlers, helpers, queues, schedulers, seeds, validation
  config/               Prisma and ImageKit clients
  databases/            Prisma models (*.prisma) and generated client types
  middlewares/          auth, access control, upload and validation middleware
  modules/              feature modules (controller / service / routes / interface)
  routes/               root router mounted at /api/v1
  templates/            e-mail templates
```

Modules: auth, admin, hospital, hospital-group, doctor, staff, patient,
appointment, prescription, invoice, payment, tax, meeting, google, zoom,
attachment, address.

## Getting started

```bash
npm install
npx prisma generate
npm run dev          # tsx --watch src/index.ts
```

Other scripts:

| Script | What it does |
| --- | --- |
| `npm run seed` | Seed demo hospitals, doctors, staff and patients |
| `npm run tax-seed` | Seed tax rates |
| `npm run worker` | Start the BullMQ workers |

## Environment variables

Create a `.env` file (never commit it):

```
NODE_ENV=development
PORT=
DATABASE_URL=
FRONTEND_URL=
ACCESS_JWT_SECRET=
REFRESH_JWT_SECRET=
REDIS_HOST=
REDIS_PORT=
IMAGE_KIT_PUBLIC_KEY=
IMAGE_KIT_PRIVATE_KEY=
IMAGE_KIT_ENDPOINT=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URL=
ZOOM_ACCOUNT_ID=
ZOOM_CLIENT_ID=
ZOOM_CLIENT_SECRET=
```

The API is served under `/api/v1`.
