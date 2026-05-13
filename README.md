# Campus Care

**New here?** Follow **[RUNBOOK.md](./RUNBOOK.md)** — exact Windows steps (folder location, PowerShell `cd`, `.env`, MongoDB, `npm install`, run commands).

Monorepo layout:

- `server/` — Express + MongoDB + Socket.IO + JWT (dual secret for platform admins) + Passport Google OAuth
- `client/` — React 19 + Vite + React Hook Form + Zod + Toastify + QR codes + Socket.IO client

## Prerequisites

- Node.js 20+
- MongoDB — local (`docker compose up -d`) or Atlas
- Optional: Cloudinary, SMTP, Google OAuth client (social login)

## Setup

1. **MongoDB** — from repo root: `docker compose up -d` (listens on `27017`).

2. **Environment** — copy templates:

   ```bash
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```

   Set `MONGODB_URI`, `JWT_SECRET`, `JWT_PLATFORM_SECRET`, and bootstrap the platform admin with `SEED_PLATFORM_ADMIN_EMAIL` / `SEED_PLATFORM_ADMIN_PASSWORD`.

3. **Install & run** (from **this** directory, the monorepo root):

   ```bash
   npm install
   npm run dev
   ```

   This starts the API on port **5000** and the Vite app on **5173**.

   Or run workspaces separately: `npm run dev -w campus-care-server` and `npm run dev -w campus-care-client`.

## Web API documentation

Interactive **Swagger UI**: `http://localhost:5000/api/docs`  
Machine-readable **OpenAPI JSON**: `http://localhost:5000/api/openapi.json`

Import `openapi.json` into Postman, Insomnia, or any OpenAPI client.

## GraphQL

**Apollo Server** at **`POST /graphql`** (browser IDE / Sandbox at **`GET /graphql`** when not in production, or use Sandbox embedded).

- Same **`Authorization: Bearer <JWT>`** header as REST.
- Example queries: `gqlCities`, `gqlColleges`, `gqlMe`, `gqlComplaints`, mutations `gqlUpdateComplaintStage`, `gqlReplyToComplaint`.

With Vite dev server, you can open **`http://localhost:5173/graphql`** (proxied to port 5000).

## Typical provisioning flow

1. Sign in as the platform admin → `/admin/platform`.
2. Create a college → share the QR + registration key.
3. Add departments on each college card.
4. College admin registers at `/register/college` → approve in platform dashboard.
5. Department admins register at `/register/dept` → college admin approves.
6. Department admins approve students when `requiresStudentApproval` is enabled on that college.

## GitHub

Initialize and push (replace `YOUR_USER` / repo name):

```bash
git init
git add .
git commit -m "Campus Care monorepo"
git branch -M main
git remote add origin https://github.com/YOUR_USER/campus-care.git
git push -u origin main
```

Or with GitHub CLI: `gh repo create campus-care --public --source=. --remote=origin --push`

## Security notes for production

- Rotate `JWT_SECRET` and `JWT_PLATFORM_SECRET`; never ship defaults.
- Tighten `CLIENT_URL` / CORS to your real origins.
- Prefer HTTPS for OAuth redirects and production hosting.
