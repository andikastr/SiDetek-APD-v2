# SiDetek-APD
> Real-Time Personal Protective Equipment (PPE) Compliance Monitoring System

SiDetek-APD adalah sistem pengawasan kepatuhan Alat Pelindung Diri (APD) K3 berbasis computer vision (YOLOv11). Sistem ini mendeteksi dan mengaudit penggunaan:
- **Safety Helmet** (Standar EN 397)
- **Reflective Jacket** (Standar EN ISO 20471)

Arsitektur sistem dibangun dengan pola *decoupled microservices*: microservice inferensi mandiri teroptimasi CPU di backend dan aplikasi web analitik modern di frontend.

---

## Arsitektur Sistem

```
SiDetek-APD/
├── ai-engine/               # Microservice Computer Vision (FastAPI + YOLOv11)
│   ├── app/
│   │   ├── api/v1/          # REST POST /api/v1/detect & WebSocket /api/v1/ws/stream
│   │   ├── core/            # YOLO Engine, Evaluator K3, Config
│   │   └── schemas/         # Pydantic Schemas
│   ├── assets/              # Dataset sampel pengujian
│   ├── weights/             # Bobot model (model-deteksi-apd.pt)
│   ├── Dockerfile           # Multi-stage CPU-optimized container
│   └── render.yaml          # Blueprint deployment Render
│
├── fullstack/               # Web Application (Next.js 16 + Tailwind + Prisma)
│   ├── prisma/              # Skema ORM database (SQLite dev / Supabase Postgres)
│   ├── public/              # Aset statis & foto sampel pengujian
│   └── src/
│       ├── app/             # Dashboard, Studio Deteksi, Log Audit, Analitik
│       ├── components/      # UI components (ImageDetector, WebcamDetector, dll.)
│       └── lib/             # Client API & Prisma singleton
│
└── README.md
```

---

## Fitur Utama

- **Overview Dashboard:** Metrik kepatuhan K3 agregat, total helm & rompi terdeteksi, serta ringkasan riwayat audit terkini.
- **Studio Deteksi:**
  - *Unggah Gambar:* Pratinjau interaktif dengan overlay bounding box vektor dan evaluasi kepatuhan instan.
  - *Live Webcam:* Streaming video real-time via WebSocket (<50ms latency) dengan overlay canvas responsif.
- **Log Riwayat Audit:** Filter berdasarkan status kepatuhan dan sumber inspeksi, inspeksi detail beresolusi penuh, dan manajemen arsip.
- **Analitik K3:** Distribusi status kepatuhan, perbandingan volume APD, dan rekomendasi keselamatan otomatis.

---

## Panduan Menjalankan

### 1. Menjalankan AI Engine

```powershell
cd ai-engine

# Jalankan server FastAPI menggunakan environment bawaan:
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Check: [http://localhost:8000/health](http://localhost:8000/health)

### 2. Menjalankan Web Application

Buka terminal baru:

```powershell
cd fullstack

# Jalankan development server Next.js:
npm.cmd run dev
```

Buka peramban di [http://localhost:3000](http://localhost:3000).

---

## Deployment

### AI Engine (Render)
- Runtime: Docker (`ai-engine/Dockerfile`)
- Health Check Path: `/health`
- Port: `8000`

### Fullstack Web App (Vercel)
- Framework Preset: Next.js
- Root Directory: `fullstack`
- Environment Variables:
  - `NEXT_PUBLIC_AI_ENGINE_URL`: URL backend Render
  - `NEXT_PUBLIC_AI_ENGINE_WS_URL`: WebSocket URL backend Render
  - `DATABASE_URL`: Connection string database PostgreSQL (Supabase)

---

## Lisensi & Kontributor
Dikembangkan oleh **ANDIKA SATRIA PUTRA** untuk implementasi K3 cerdas di lingkungan kerja konstruksi.
