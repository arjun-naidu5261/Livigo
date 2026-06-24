# Livigo — PG / Co-living Platform

Monorepo with a React frontend and Express + MongoDB backend.

## Project structure

```
livigo/
├── frontend/     React + Vite + TypeScript UI
├── backend/      Express.js + MongoDB API
└── package.json  Root scripts to run both apps
```

## Prerequisites

- Node.js 18+
- MongoDB running locally (or a MongoDB Atlas connection string)

## Setup

1. Install dependencies:

```bash
npm run install:all
```

2. Configure backend environment:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your MongoDB URI and JWT secret.

3. Seed default amenities (optional — also runs automatically on server start):

```bash
npm run seed
```

## Development

Run both frontend and backend together:

```bash
npm run dev
```

- Frontend: http://localhost:8080
- Backend API: http://localhost:5001

Or run them separately:

```bash
npm run dev:backend
npm run dev:frontend
```

## API overview

| Area | Base path |
|------|-----------|
| Auth | `/api/auth` |
| PG listings | `/api/pgs` |
| Bookings | `/api/bookings` |
| Owner dashboard | `/api/owner` |
| Tenant dashboard | `/api/tenant` |
| Admin dashboard | `/api/admin` |
| Amenities | `/api/amenities` |

Uploaded PG images are served from `/uploads/pg-images/`.

## Tech stack

**Frontend:** React, TypeScript, Vite, Tailwind, shadcn/ui, React Query

**Backend:** Express.js, MongoDB (Mongoose), JWT auth, Multer file uploads
