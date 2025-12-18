# OBSCURA.AI - Deployment Guide

Welcome to the **OBSCURA.AI** setup guide. Follow these steps to make your application live on Cloudflare Pages.

## PHASE 1: Google Identity Setup (Login)

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project named "Obscura".
3. Under **APIs & Services > OAuth consent screen**, set to **External** and provide basic app info.
4. Under **Credentials > Create Credentials > OAuth client ID**, select **Web application**.
5. Add your domain (e.g., `https://obscura-ai.pages.dev`) to **Authorized JavaScript origins**.
6. Copy the **Client ID**.

---

## PHASE 2: Cloudflare Pages Deployment

1. **GitHub**: Push this repository to your GitHub account.
2. **Cloudflare**: Navigate to **Workers & Pages > Create Application > Pages > Connect to Git**.
3. **Build Settings**:
   - **Framework Preset**: `Vite`
   - **Build command**: `npm run build`
   - **Output directory**: `dist`
4. **Environment Variables**:
   - `VITE_GOOGLE_CLIENT_ID`: Your Client ID from Phase 1.
   - `API_KEY`: Your Google Gemini API Key. This will be used as the default key for all users for basic tasks.
5. **Deploy**: Click "Save and Deploy".

---

## SYSTEM ARCHITECTURE NOTE

OBSCURA.AI uses a hybrid key strategy:
- **Global Key**: Provided via `API_KEY` env var. Used for general analysis and chat.
- **User Key**: For the **VISIONARY (Pro Image)** module, users are prompted to select their own key via `window.aistudio.openSelectKey()`. This protects your billing for high-cost tasks.

**Success!** Your Cinematic AI Suite is ready for production.

<!-- Build fix applied: TypeScript configuration and dependencies updated -->
