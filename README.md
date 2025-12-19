
# OBSCURA.AI - Deployment & Configuration Guide

## 🚨 CRITICAL SETUP: Fixing "Error 403: access_denied"

If you see an **Access Blocked** error when trying to link Google Drive, you MUST configure the **Authorized JavaScript origins** in Google Cloud Console correctly.

1. Go to **[Google Cloud Console > Credentials](https://console.cloud.google.com/apis/credentials)**.
2. Open your **OAuth 2.0 Client ID**.
3. Scroll to **Authorized JavaScript origins**.
4. **ADD YOUR DOMAINS** (Ensure NO trailing slashes!):
   - ✅ `https://obscura-ai.pages.dev`
   - ❌ `https://obscura-ai.pages.dev/` (This will FAIL)
   - ✅ `http://localhost:5173`
5. Click **Save**. *Note: It may take 5-10 minutes to propagate.*

---

## PHASE 1: Google Identity Setup

1. Create a project in [Google Cloud Console](https://console.cloud.google.com/).
2. Enable **Google Drive API**.
3. Create OAuth Credentials > **Web application**.
4. Add the Origins listed above.
5. Copy the **Client ID**.

## PHASE 2: Cloudflare/Netlify Deployment

1. **Build Settings**:
   - Command: `npm run build`
   - Output Directory: `dist`
2. **Environment Variables**:
   - `VITE_GOOGLE_CLIENT_ID`: (From Phase 1)
   - `API_KEY`: (Your Google Gemini API Key from [aistudio.google.com](https://aistudio.google.com/))

## SYSTEM ARCHITECTURE

- **Gemini Service**: Handles text/image analysis via API Key.
- **Drive Service**: Handles file storage via OAuth 2.0 (requires Client ID & Origin matching).
- **One-Tap Sign In**: Used for aesthetic login effect (requires Client ID).
