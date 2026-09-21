# ClipForge 🎬✨
### Production-Ready AI Video Clipping Platform

**ClipForge** is a modern SaaS platform that turns long-form videos (up to 5 minutes) into scroll-stopping short-form clips (10–30s) optimized for TikTok, Instagram Reels, and YouTube Shorts.

---

## 🚀 Key Features

- **Automated Moment Detection (`ClipAnalyzer`)**: Heuristic & scene-activity analysis algorithm combining scene cut detection, vocal audio energy, and silence avoidance to identify peak engagement moments.
- **Aspect Ratio Re-Framing**: One-click 9:16 vertical conversion featuring an ambient blurred video backdrop, 1:1 square, and 16:9 widescreen.
- **Interactive Browser Clip Editor**:
  - Dual-handle interactive timeline scrubber with sub-second trimming.
  - Mobile phone simulator frame with hardware notches and status bar for realistic social preview.
  - Video speed adjustments (0.5x, 1x, 1.5x, 2x) and audio gain boost (0–200%).
  - Real-time color filters: Normal, Bright & Crisp, Deep Contrast, Monochrome, and Vintage Warmth.
  - Dynamic customizable text overlays with font sizing, color pickers, and alignments.
  - Auto-captions with viral themes: *Bold Punch*, *Classic Subtitle*, *Word Glow*, and *Minimal Clean*.
- **Asynchronous Background Processing Queue**: Non-blocking job runner with real-time progress tracking (`Analyzing your video...` → `Finding interesting moments...` → `Creating clips...` → `Your clips are ready!`).
- **Server-Side FFmpeg Rendering Engine**: GPU/CPU hardware-accelerated video clipping, scaling, filter chaining, and fast MP4 export in 720p and 1080p.
- **Zero-Config Database Strategy**: Standard Mongoose models (`User`, `Video`, `Clip`, `Project`) with seamless automatic in-memory MongoDB runner fallback for local dev when an external database is not running.
- **Production-Ready Docker Setup**: Multi-stage Docker build and Docker Compose orchestrating Node.js, FFmpeg, and MongoDB.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript & Vite
- **Styling**: Tailwind CSS with dark-mode creator aesthetic & glassmorphism
- **Icons**: Lucide React
- **Routing**: React Router v6
- **Animations**: Framer Motion

### Backend
- **Runtime**: Node.js v20+ with TypeScript
- **Server**: Express.js
- **Processing**: Native FFmpeg 9.x and FFprobe
- **Database**: MongoDB with Mongoose (with `mongodb-memory-server` fallback)
- **Auth & Security**: JWT tokens, bcryptjs password hashing, Helmet headers, Multer validation

---

## 📁 Monorepo Structure

```text
clipforge/
│
├── client/                     # Vite + React + TypeScript Frontend
│   ├── src/
│   │   ├── components/         # Nav, Sidebar, VideoPlayer, PhoneFrame, Timeline, Tools
│   │   ├── pages/              # Landing, Login, Register, Dashboard, Upload, Clips, Editor
│   │   ├── layouts/            # DashboardLayout, AuthLayout
│   │   ├── context/            # AuthContext, ToastContext
│   │   ├── services/           # Typed API client
│   │   └── types/              # TypeScript models
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── server/                     # Node.js + Express + TypeScript Backend
│   ├── src/
│   │   ├── controllers/        # Auth, Video, Clip, Export, Media controllers
│   │   ├── routes/             # REST API routers
│   │   ├── models/             # Mongoose schemas (User, Video, Clip, Project)
│   │   ├── services/           # FFmpegService, ClipAnalyzer, CaptionService, ExportService
│   │   ├── jobs/               # Background JobQueue with progress tracking
│   │   ├── middleware/         # JWT Auth, Multer video upload, Error handling
│   │   ├── config/             # Database & Environment configuration
│   │   ├── test_workflow.ts    # End-to-end media pipeline test
│   │   └── test_api.ts         # Live HTTP REST API test suite
│   ├── package.json
│   └── tsconfig.json
│
├── uploads/                    # Local storage for source videos
├── outputs/                    # Local storage for extracted and rendered clips
├── thumbnails/                 # Local storage for generated video poster frames
├── Dockerfile                  # Production container definition
├── docker-compose.yml          # Container orchestration (App + MongoDB)
├── .env.example                # Sample environment configuration
└── README.md
```

---

## ⚡ Quick Start (Local Development)

### 1. Prerequisites
- **Node.js** v18+ and **npm** installed
- **FFmpeg & FFprobe** installed and added to your system `PATH` (or configured via `.env`)

### 2. Clone and Configure Environment
Copy `.env.example` to `server/.env`:
```bash
cd server
cp ../.env.example .env
```

Review the default `server/.env` parameters:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/clipforge
JWT_SECRET=your_jwt_secret_key_here
UPLOAD_DIR=../uploads
OUTPUT_DIR=../outputs
THUMBNAIL_DIR=../thumbnails
MAX_VIDEO_DURATION=300
MAX_FILE_SIZE=104857600
CLIENT_URL=http://localhost:5173
```
> **Note**: If no MongoDB server is running on `127.0.0.1:27017`, ClipForge automatically initializes a zero-config in-memory database instance so you can start clipping immediately without database setup!

### 3. Install Dependencies
In the root directory:
```bash
# Install Server dependencies
cd server
npm install

# Install Client dependencies
cd ../client
npm install
```

### 4. Start Development Servers

**Start the Backend Server (Port 5000):**
```bash
cd server
npm run dev
```

**Start the Frontend Client (Port 5173):**
```bash
cd client
npm run dev
```

Open your browser and navigate to:
```text
http://localhost:5173
```

---

## 🧪 Automated Testing

ClipForge includes a comprehensive automated testing suite verifying every stage of the pipeline:

### 1. End-to-End Pipeline Test
Verifies synthetic video generation, FFprobe metadata extraction, duration boundaries (<= 300s pass, > 300s rejected), poster frame extraction, `ClipAnalyzer` moment detection, physical trimming, timed captions, and full 9:16 vertical FFmpeg rendering with filters & overlays:
```bash
cd server
npx tsx src/test_workflow.ts
```

### 2. Live HTTP REST API Integration Test
Spawns an Express instance and tests all 11 endpoints over HTTP:
```bash
cd server
npx tsx src/test_api.ts
```

---

## 🐳 Docker Deployment

To launch ClipForge with a dedicated MongoDB container:

```bash
docker-compose up --build -d
```

The application will be accessible at:
```text
http://localhost:5000
```

To stop containers:
```bash
docker-compose down
```

---

## 🔌 Integrating External AI Models

ClipForge features a modular interface architecture:
- **Scene/Audio Analysis**: Replace `HeuristicClipAnalyzer` in `server/src/services/ClipAnalyzer.ts` by implementing `IClipAnalyzer` with OpenAI Whisper transcript analysis or Google Gemini 1.5/2.0 multimodal video analysis.
- **Speech Transcription**: Implement `ICaptionService` in `server/src/services/CaptionService.ts` to connect to OpenAI Whisper API or Deepgram.
- **Cloud Storage**: Implement `IStorageService` in `server/src/services/StorageService.ts` to stream directly to an AWS S3 bucket.

---

## 📄 License
MIT License © 2026 ClipForge Inc.
