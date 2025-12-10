# OBSCURA.AI - Deployment Guide

Welcome to the **OBSCURA.AI** setup guide. Follow these steps to make your application live.

## PHASE 1: Credentials Setup (Required for Login)

### Step 1: Get Google Client ID (The Login)
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a **New Project** (name it "Obscura App").
3. Navigate to **APIs & Services > OAuth consent screen**.
   - Select **External**.
   - Fill in App Name ("Obscura") and email.
   - Click Save.
4. Navigate to **APIs & Services > Credentials**.
   - Click **Create Credentials** > **OAuth client ID**.
   - Application Type: **Web application**.
   - **Authorized JavaScript origins**:
     - Add `http://localhost:5173` (for local testing).
     - Add your live URL (e.g., `https://obscura-ai.pages.dev`) once you have it.
   - Click **Create**.
5. Copy the **Client ID** (ends in `.apps.googleusercontent.com`).

---

## PHASE 2: Live Deployment (Cloudflare Pages)

### 1. GitHub Setup
1. Go to [GitHub.com](https://github.com) and create a new repository named `obscura-ai`.
2. Upload all your project files to this repository.

### 2. Cloudflare Pages Setup
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) > **Workers & Pages**.
2. Click **Create Application** > **Connect to Git**.
3. Select your `obscura-ai` repository.
4. **Build Settings**:
   - **Framework Preset**: Vite
   - **Build command**: `npm run build`
   - **Output directory**: `dist`
5. **Environment Variables**:
   - Add variable `GOOGLE_CLIENT_ID` = (Paste your Client ID from Phase 1)
   - **IMPORTANT**: Do NOT add an `API_KEY` variable if you want users to provide their own keys. If you leave this empty, the app will automatically show the "Gatekeeper" screen to users.
6. Click **Save and Deploy**.

### 3. Final Connection
1. Once deployed, Cloudflare will give you a URL (e.g., `https://obscura-ai.pages.dev`).
2. Go back to **Google Cloud Console** > Credentials > Your Client ID.
3. Add this new URL to **Authorized JavaScript origins**.
4. Save.

**Success!** Your Cinematic AI Suite is now live.