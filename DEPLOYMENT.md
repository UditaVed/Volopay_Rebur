# Deployment Guide: Make ReBur Live for Public Use

To make ReBur accessible to graders, team members, and anyone on the internet, follow this standard two-step deployment architecture:

```
[Users / Graders / Reviewers]
            │
            ├─────────────────────────────────────────┐
            ▼                                         ▼
┌──────────────────────────────┐        ┌──────────────────────────────┐
│ Next.js Frontend             │        │ FastAPI & FastMCP Backend    │
│ Hosted on: Vercel (Free)     │───────►│ Hosted on: Render (Free)     │
│ URL: https://rebur.vercel.app│  REST  │ URL: https://rebur.onrender… │
└──────────────────────────────┘        └──────────────┬───────────────┘
                                                       │ Streamable SSE
                                                       ▼
                                        ┌──────────────────────────────┐
                                        │ Claude Desktop / AI Agents   │
                                        │ https://rebur.onrender…/mcp  │
                                        └──────────────────────────────┘
```

---

## Step 1: Push Code to Your GitHub

Your Mac is already signed in to GitHub (`gh` CLI). Run this single command in your terminal from the project root:

```bash
gh repo create ReBur --public --source=. --remote=origin --push
```

This will automatically create a public GitHub repository under your profile and push all commits.

---

## Step 2: Deploy the Backend to Render (5 Minutes, 100% Free)

1. Go to **[render.com](https://render.com)** and sign in with GitHub.
2. Click **New +** → **Web Service**.
3. Select your newly created **`ReBur`** repository.
4. Fill in these settings:
   - **Name:** `rebur-backend`
   - **Root Directory:** `backend`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type:** `Free`
5. Under **Environment Variables**, add:
   - `DEFAULT_WORKSPACE_ID` = `ws_demo_123`
   - `DATABASE_URL` = `sqlite:///./expenses.db`
   - `MAX_AUTO_APPROVAL_AMOUNT_INR` = `5000.0`
   - `MAX_AUTO_APPROVAL_AMOUNT_USD` = `100.0`
   - `SUPABASE_URL` = *(Your Supabase Project URL)*
   - `SUPABASE_SERVICE_KEY` = `your-supabase-service-key-here`
6. Click **Create Web Service**.

> Render will give you a public URL like: **`https://rebur-backend.onrender.com`**.
> Claude and the public can now connect to your MCP server at: **`https://rebur-backend.onrender.com/mcp`**!

---

## Step 3: Deploy the Frontend to Vercel (2 Minutes, 100% Free)

1. Go to **[vercel.com](https://vercel.com)** and sign in with GitHub.
2. Click **Add New…** → **Project**.
3. Import your **`ReBur`** repository.
4. In the configuration screen:
   - **Root Directory:** Click "Edit" and choose **`frontend`**.
   - **Framework Preset:** `Next.js` (automatically detected).
   - **Environment Variables:**
     - Key: `NEXT_PUBLIC_API_URL`
     - Value: `https://rebur-backend.onrender.com` *(your Render backend URL from Step 2)*
5. Click **Deploy**.

> In ~60 seconds, Vercel will give you a production URL like **`https://rebur.vercel.app`**.
> Anyone anywhere in the world can now open the dashboard and use the app!

---

## Alternative: Instant 10-Second Live Public URL (No Cloud Account Required)

If you need a live public HTTPS URL immediately (e.g. while recording your demo video or giving a quick link to a grader right this second), you can expose your local server with **Localtunnel**:

### 1. Make the Backend Public:
```bash
npx --yes localtunnel --port 8000
```
This prints: `your url is: https://xxxx.loca.lt`.
*Anyone on the internet can now access your FastAPI & MCP server at that URL!*

### 2. Make the Frontend Public:
```bash
npx --yes localtunnel --port 3000
```
*Anyone can now open your Next.js dashboard from their phone, tablet, or laptop.*

