# DataMeridian

A research data lifecycle platform for managing, validating, versioning, sharing, and preserving scientific datasets.

## Stack

- **Client**: React 18 + Vite, React Router, Tailwind CSS, Framer Motion, Lucide React, Recharts
- **Server**: Node.js + Express, MongoDB + Mongoose, JWT + bcrypt auth
- **AI**: Real AI-provider integration (`server/services/aiProvider.js` + `aiService.js`) using a configurable OpenAI-compatible chat-completions endpoint. AI features are disabled with a clear message until `AI_API_KEY` is set.

## Getting Started

### 1. Server

```bash
cd server
npm install
copy .env.example .env   # then edit MONGO_URI / JWT_SECRET / AI_API_KEY
npm run dev
```

Server runs at `http://localhost:5000`.

### 2. Client

```bash
cd client
npm install
npm run dev
```

Client runs at `http://localhost:5173`.

## Project Structure

See `server/` and `client/` for the backend and frontend respectively. Backend follows a controller/route/service/model architecture; frontend uses pages/components/context/services/hooks.

## Environment Variables (`server/.env`)

```
MONGO_URI=mongodb://127.0.0.1:27017/datameridian
JWT_SECRET=replace-with-a-long-random-secret
PORT=5000
CLIENT_URL=http://localhost:5173

# AI provider (optional — AI features are disabled until AI_API_KEY is set)
AI_PROVIDER=openai
AI_API_KEY=
AI_MODEL=gpt-4o-mini
AI_BASE_URL=https://api.openai.com/v1

# Storage provider: use local for development or cloud for Render production.
STORAGE_PROVIDER=local
UPLOAD_DIR=./uploads

# S3-compatible storage (required when STORAGE_PROVIDER=cloud)
S3_BUCKET=
S3_REGION=auto
S3_ENDPOINT=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_FORCE_PATH_STYLE=false

# Optional configured capacity used for the "Available Storage" stat (GB)
STORAGE_CAPACITY_GB=
```

## Dataset Storage

Local filesystem storage is enabled by default for development, college projects, demonstrations, and testing. Set `STORAGE_PROVIDER=local` and optionally configure `UPLOAD_DIR`. Render production should set `STORAGE_PROVIDER=cloud` and configure the private S3-compatible bucket variables above. See [STORAGE.md](STORAGE.md) for the architecture, security guidance, analytics behavior, and migration checklist.

