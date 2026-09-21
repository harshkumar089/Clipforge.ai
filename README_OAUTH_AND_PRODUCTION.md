# ClipForge — Production Database & Google Authentication Setup Guide

This guide walks you through configuring Google OAuth 2.0 / OpenID Connect, persistent MongoDB storage, and multi-tenant user isolation for ClipForge.

---

## 1. Google Cloud Console OAuth 2.0 Setup

To enable "Continue with Google" sign-in:

1. Navigate to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing project (e.g., `ClipForge SaaS`).
3. Under **APIs & Services** > **OAuth consent screen**:
   - Select **External** user type.
   - Enter your App name: `ClipForge`.
   - Provide your support email and developer contact email.
   - Add the scopes:
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
     - `openid`
   - Save and continue.
4. Under **APIs & Services** > **Credentials**:
   - Click **+ CREATE CREDENTIALS** > **OAuth client ID**.
   - Application type: **Web application**.
   - Name: `ClipForge Web Client`.
   - **Authorized JavaScript origins**:
     - `http://localhost:5173` (Vite dev server)
     - `http://localhost:5000` (Production backend & API)
   - **Authorized redirect URIs**:
     - `http://localhost:5000/api/auth/google/callback`
     - *(In production: `https://yourdomain.com/api/auth/google/callback`)*
5. Click **Create**. Copy the **Client ID** and **Client Secret**.

---

## 2. Environment Configuration

Copy the example environment file:

```bash
# In the project root or server directory:
cp .env.example .env
cp server/.env.example server/.env
```

Populate the `.env` file with your credentials:

```ini
NODE_ENV=development
PORT=5000
SERVER_URL=http://localhost:5000
CLIENT_URL=http://localhost:5173

# MongoDB Connection
# Option A: Local MongoDB
MONGODB_URI=mongodb://localhost:27017/clipforge
# Option B: MongoDB Atlas (Cloud)
# MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/clipforge?retryWrites=true&w=majority

# JWT & Cookie Security
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
COOKIE_NAME=clipforge_auth

# Google OAuth 2.0
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Storage Driver: "local" (default) or "s3"
STORAGE_DRIVER=local
```

---

## 3. Running with Docker Compose (Production Ready)

To launch ClipForge with a containerized MongoDB instance and persistent named volumes:

```bash
# Start MongoDB and ClipForge
docker-compose up -d

# View logs
docker-compose logs -f
```

The Docker setup automatically initializes:
- `clipforge_mongo`: Persistent MongoDB database volume so user data is never lost.
- `clipforge_uploads`, `clipforge_outputs`, `clipforge_thumbnails`: Persistent media storage.
- HTTP server listening on `http://localhost:5000`.

---

## 4. Multi-Tenant User Isolation & Zero-IDOR Architecture

ClipForge enforces strict ownership checks across all layers:

1. **Authentication Token & Cookie**:
   - Secure HTTP-only cookies (`clipforge_auth`) prevent XSS token theft.
   - Dual-mode support for native Bearer authorization headers and browser cookies.
2. **Database Queries**:
   - Every `Video`, `Clip`, `Project`, and `Export` record is tied to an indexed `userId`.
   - All controller queries filter by `{ _id: resourceId, userId: req.user._id }`.
   - Modifying a URL or payload ID returns `404 Not Found` or `403 Forbidden` if the resource belongs to another user.
3. **Storage Paths**:
   - Media storage is partitioned per user: `users/{userId}/videos/...`, `users/{userId}/clips/...`, `users/{userId}/exports/...`.
4. **Editor Autosave**:
   - Real-time debounced 750ms autosave to `/api/projects`.
   - Full continuity: font choices, kinetic typography presets, trims, aspect ratios, filters, and overlays are preserved when closing and reopening the browser.
