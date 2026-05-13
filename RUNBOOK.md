# Campus Care — step-by-step run guide (Windows)

This guide assumes **nothing is set up yet**. Do the steps **in order**.

---

## Part A — Where is the project? Why you might not see `campus-care` in Cursor

The code lives in a folder named **`campus-care`** on your computer.

- If this chat created it inside your **Cursor workspace**, it might be at something like:
  - `C:\Users\<YourName>\.cursor\projects\<project-name>\campus-care`
  - or whatever folder you chose when you opened Cursor.

- If you **don’t** see `campus-care` in the sidebar:
  1. In Cursor: **File → Open Folder…**
  2. Browse to the folder that **contains** `campus-care` (the parent folder), **or** open `campus-care` itself.
  3. You should see **`server`**, **`client`**, and **`package.json`** at the top level if you opened **`campus-care`** correctly.

**Rule:** Every command below must run with **that** folder as your current directory (see Part C).

---

## Part B — Install tools (one-time)

### Step 1 — Node.js

1. Open a browser.
2. Go to **https://nodejs.org**
3. Download the **LTS** installer for Windows.
4. Run the installer. Accept defaults.
5. Close and reopen **PowerShell** (or Terminal).

### Step 2 — Docker Desktop (optional but easiest for MongoDB)

Only if you want MongoDB in one click:

1. Go to **https://www.docker.com/products/docker-desktop/**
2. Install **Docker Desktop** for Windows.
3. Start Docker Desktop and wait until it says it is running.

If you **skip Docker**, use **MongoDB Atlas** (cloud) instead and put its connection string in `server\.env` as `MONGODB_URI` (see Part D).

---

## Part C — Open the correct folder in PowerShell

### Step 1 — Open PowerShell

1. Press **Windows key**.
2. Type **PowerShell**.
3. Click **Windows PowerShell** (or **Terminal**).

### Step 2 — Go to your project folder

Replace the path below with **your real path** to `campus-care`.

Example (adjust `<YourName>` and the path):

```powershell
cd C:\Users\<YourName>\campus-care
```

Check you are in the right place:

```powershell
dir
```

You should see folders **`server`** and **`client`**, and file **`package.json`**.

If `dir` shows an error or wrong files, **stop** and fix the path before continuing.

---

## Part D — Environment files

### Step 1 — Copy example env files

Still inside **`campus-care`**:

```powershell
copy server\.env.example server\.env
copy client\.env.example client\.env
```

### Step 2 — Edit `server\.env`

1. Open **`campus-care\server\.env`** in Notepad or Cursor.
2. Set at least:
   - **`MONGODB_URI`** — if using local Docker MongoDB (next part), use:
     - `mongodb://127.0.0.1:27017/campus_care`
   - **`JWT_SECRET`** — any long random string (example: 32+ characters).
   - **`JWT_PLATFORM_SECRET`** — a **different** long random string.
   - **`CLIENT_URL`** — `http://localhost:5173`
   - **`SEED_PLATFORM_ADMIN_EMAIL`** — your admin login email (example: `admin@local.test`).
   - **`SEED_PLATFORM_ADMIN_PASSWORD`** — a strong password you will remember.

3. Save the file.

---

## Part E — Start MongoDB (pick one)

### Option 1 — Docker (from `campus-care` folder)

```powershell
docker compose up -d
```

Wait until it finishes without errors.

### Option 2 — MongoDB Atlas

1. Create a free cluster at **https://www.mongodb.com/cloud/atlas**
2. Get the connection string.
3. Put it in **`server\.env`** as **`MONGODB_URI`**.

---

## Part F — Install dependencies

In **`campus-care`**:

```powershell
npm install
```

Wait until it finishes (can take a few minutes the first time).

---

## Part G — Run the app (two terminals)

You need **two** terminal windows, both starting in **`campus-care`**.

### Terminal 1 — Backend (API + GraphQL + WebSockets)

```powershell
cd C:\Users\<YourName>\campus-care
npm run dev -w campus-care-server
```

Leave this running. You should see a message like the API listening on port **5000**.

### Terminal 2 — Frontend (Vite)

Open a **second** PowerShell:

```powershell
cd C:\Users\<YourName>\campus-care
npm run dev -w campus-care-client
```

Leave this running. It usually prints **http://localhost:5173**.

---

## Part H — Open in the browser

| What | URL |
|------|-----|
| Web app | http://localhost:5173 |
| REST Swagger UI | http://localhost:5173/api/docs *(proxied to the server)* or http://localhost:5000/api/docs |
| OpenAPI JSON | http://localhost:5000/api/openapi.json |
| **GraphQL (Apollo Sandbox)** | http://localhost:5000/graphql |

### GraphQL auth

Use the **same** JWT as REST: header **`Authorization: Bearer <token>`**  
(Get a token by logging in through the UI or `POST /api/auth/login`.)

---

## Part I — Optional: one command for both servers

From **`campus-care`** (after `npm install`):

```powershell
npm run dev
```

This runs API + web together (uses `concurrently` from the root `package.json`).

---

## Part J — If something fails

1. **Wrong folder** — `dir` must show `server`, `client`, `package.json`.
2. **MongoDB** — Docker running? Or Atlas URI correct?
3. **JWT errors** — `JWT_SECRET` and `JWT_PLATFORM_SECRET` must be set in **`server\.env`**.
4. **Port in use** — Another app may be using **5000** or **5173**. Close that app or change `PORT` / Vite port in config.

---

## GraphQL operations (examples)

**Public — cities:**

```graphql
query {
  gqlCities
}
```

**Authenticated — who am I:**

```graphql
query {
  gqlMe {
    id
    email
    role
  }
}
```

(Add the `Authorization` header in Apollo Sandbox: **HTTP Headers** → `{ "Authorization": "Bearer YOUR_TOKEN" }`.)

---

That’s the full path from “nothing installed” to “app + REST + GraphQL running.”
