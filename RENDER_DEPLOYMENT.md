# 🚀 Render Deployment Guide for Botivate MOM AI Assistant

This guide provides step-by-step instructions to deploy the Botivate system (Backend + Frontend) on [Render.com](https://render.com).

## 🛠 Prerequisites

1.  **GitHub Repository:** Ensure your entire project is pushed to a GitHub repository.
2.  **Render Account:** Create a free account on Render.
3.  **Environment Variables:** Have your `.env` values ready (API Keys, Google Credentials, etc.).

---

## 📂 Project Structure Note
Your repository should have the following structure:
```text
root/
├── backend/
│   ├── app/
│   ├── requirements.txt
│   └── ...
└── frontend/
    ├── src/
    ├── package.json
    └── ...
```

---

## 🌎 Phase 1: Backend Deployment (FastAPI)

1.  Log in to [Render Dashboard](https://dashboard.render.com).
2.  Click **New +** and select **Web Service**.
3.  Connect your GitHub repository.
4.  Configure the service:
    *   **Name:** `botivate-backend`
    *   **Root Directory:** `backend`
    *   **Runtime:** `Python 3`
    *   **Build Command:** `pip install -r requirements.txt`
    *   **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
    *   **Plan:** Free or Starter (Free tier spins down after inactivity).

5.  **Environment Variables:**
    Go to the **Environment** tab and add the following keys from your `.env`:
    *   `OPENAI_API_KEY`: Your OpenAI key.
    *   `ASSEMBLY_AI_KEY`: Your AssemblyAI key.
    *   `GOOGLE_SHEETS_ID`: ID of your Google Sheet.
    *   `GOOGLE_DRIVE_FOLDER_ID`: ID of your Drive folder.
    *   `GOOGLE_SERVICE_ACCOUNT_JSON`: Copy the entire content of your JSON file.
    *   `SMTP_USER` & `SMTP_PASSWORD`: For emails.
    *   `FRONTEND_URL`: `https://your-frontend-subdomain.onrender.com` (Add this later).

6.  Click **Create Web Service**. Wait for the logs to show "Uvicorn running".
7.  **Copy the Service URL:** (e.g., `https://botivate-backend.onrender.com`).

---

## 🎨 Phase 2: Frontend Deployment (Vite + React)

1.  Click **New +** and select **Static Site**.
2.  Connect the same GitHub repository.
3.  Configure the site:
    *   **Name:** `botivate-ai`
    *   **Root Directory:** `frontend`
    *   **Build Command:** `npm install && npm run build`
    *   **Publish Directory:** `dist`

4.  **Environment Variables:**
    Add the crucial API connection variable:
    *   **Key:** `VITE_API_BASE_URL`
    *   **Value:** `https://your-backend-url.onrender.com/api/v1` (Use the URL from Phase 1).

5.  Click **Create Static Site**.

---

## 🔗 Phase 3: Setup Rewrites (Important for React Router)

Since this is a Single Page Application (SPA), you need to tell Render to redirect all requests to `index.html`.

1.  In your Frontend Static Site settings on Render, go to **Redirects/Rewrites**.
2.  Click **Add Rule**.
3.  **Source:** `/*`
4.  **Destination:** `/index.html`
5.  **Action:** `Rewrite`

---

## ⚡ Phase 4: Handle CORS (Backend Update)

Ensure your backend allows requests from your new frontend URL.

1.  Go to `backend/app/main.py`.
2.  Update `CORSMiddleware` `allow_origins`:
```python
origins = [
    "http://localhost:5173",
    "https://your-frontend-url.onrender.com", # Add this
]
```
3.  Commit and push to GitHub. Render will automatically redeploy.

---

## 🔍 Troubleshooting

*   **Python Version:** If you get a build error, add an environment variable `PYTHON_VERSION` with value `3.10` or higher.
*   **Module Not Found:** Ensure all dependencies used in the code are listed in `backend/requirements.txt`.
*   **Infinite Loading:** Check the browser console (F12). Usually, this means `VITE_API_BASE_URL` is wrong or missing `/api/v1` at the end.
*   **Google Credentials:** Make sure the Service Account email has "Editor" access to the Google Sheet and the Drive Folder.

---

## 💡 Pro Tip: Custom Domain
If you have a custom domain (e.g., `app.botivate.in`), you can add it in the **Settings** tab of both Frontend and Backend to make the app look professional.

---
**Botivate Services LLP (c) 2026**
