# Grand Egyptian Museum Tourist Guide

Backend gateway for the Grand Egyptian Museum tourist guide app.

Current services:

- `backend/`: Node.js/Express API, PostgreSQL models, JWT auth, uploads, and EJS pages.
- `ai_services/CV_Recognition/`: FastAPI computer-vision artifact recognition service on port `8000`.
- `ai_services/chatbot_LLM/`: FastAPI Groq + ChromaDB historical guide service on port `8001`.
- `frontend/`: React/Vite web app on port `5173`.

## Environment

Create `backend/.env` from `backend/.env.example` for local backend runs:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gem_museum
DB_USER=postgres
DB_PASS=1234
JWT_SECRET=change_me_in_production
AI_SERVICE_URL=http://localhost:8000
RAG_SERVICE_URL=http://localhost:8001
RAG_SERVICE_TIMEOUT_MS=180000
GROQ_API_KEY=
EMAIL_HOST=
EMAIL_PORT=
EMAIL_SECURE=false
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM="Grand Egyptian Museum Tourist Guide <no-reply@gem-guide.com>"
```

For Docker, set `GROQ_API_KEY` in your shell before startup. Do not commit real API keys.

PowerShell:

```powershell
$env:GROQ_API_KEY="your_groq_api_key"
docker compose up --build
```

## Run With Docker

Prerequisite: Docker Desktop installed and running.

Start all services:

```bash
docker compose up --build
```

Run in the background:

```bash
docker compose up --build -d
```

Seed the database manually:

```bash
docker compose exec backend npm run seed
```

Stop services:

```bash
docker compose down
```

Remove the PostgreSQL/vector database Docker volumes:

```bash
docker compose down -v
```

Service URLs:

```text
Backend:        http://localhost:3000
CV Recognition: http://localhost:8000
Chatbot LLM:    http://localhost:8001
Frontend:       http://localhost:5173
```

Quick checks:

```bash
curl http://localhost:3000
curl http://localhost:8000/health
curl http://localhost:8001/health
curl http://localhost:3000/api/ai-guide/health
curl http://localhost:3000/api/monuments
```

Docker networking:

```text
backend -> postgres       DB_HOST=postgres
backend -> cv-recognition AI_SERVICE_URL=http://cv-recognition:8000
backend -> chatbot-llm    RAG_SERVICE_URL=http://chatbot-llm:8001
```

Common Docker fixes:

- Port already in use: stop the local service using `3000`, `5432`, `8000`, or `8001`.
- PostgreSQL volume has old credentials: run `docker compose down -v`, then start again. This deletes local Docker DB data.
- Backend cannot reach CV: confirm `AI_SERVICE_URL=http://cv-recognition:8000`.
- Backend cannot reach chatbot: confirm `RAG_SERVICE_URL=http://chatbot-llm:8001`.
- Chatbot first startup is slow: it may build ChromaDB and download embedding/reranker models.
- Chatbot Docker defaults use CPU-friendly models: `sentence-transformers/all-MiniLM-L6-v2` and `cross-encoder/ms-marco-MiniLM-L-6-v2`.
- CV `model_ready=false`: restore the trained model to `ai_services/CV_Recognition/model/model.h5`.

## Run Without Docker

Terminal 1, CV Recognition:

```powershell
cd D:\Graduation\ai_services\CV_Recognition
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

Terminal 2, Chatbot LLM:

```powershell
cd D:\Graduation\ai_services\chatbot_LLM
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python pipeline/build_chunks.py
python pipeline/build_vectordb.py
$env:GROQ_API_KEY="your_groq_api_key"
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

Terminal 3, Backend:

```powershell
cd D:\Graduation\backend
npm install
npm run seed
npm run dev
```

Terminal 4, Frontend:

```powershell
cd D:\Graduation\frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

## Backend API Contracts

Artifact scan:

```http
POST /api/scan/artifact
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

Form field:

```text
image: <image file>
```

Scan history:

```http
GET /api/scan/history
Authorization: Bearer <access_token>
```

AI Guide:

```http
GET  /api/ai-guide/health
POST /api/ai-guide/ask
GET  /api/ai-guide/conversations
GET  /api/ai-guide/conversations/:id/messages
PATCH /api/ai-guide/conversations/:id/title
DELETE /api/ai-guide/conversations/:id
POST /api/ai-guide/describe
POST /api/ai-guide/identify
```

All AI Guide routes except `/health` require `Authorization: Bearer <access_token>`.

`POST /api/ai-guide/ask` now stores persistent chat history in PostgreSQL. If `conversation_id` is omitted, the backend creates a new conversation and returns `conversation_id` and `conversation_title`. Send the returned `conversation_id` on later chat messages to append to the same conversation.

## AI Flow

```text
Frontend/Mobile -> backend /api/scan/artifact -> cv-recognition /predict
Frontend/Mobile -> backend /api/ai-guide/* -> chatbot-llm
```

The backend remains the only service the frontend/mobile app should call directly.

## Postman Examples

Login:

```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json
```

```json
{
  "email": "test@example.com",
  "password": "123456"
}
```

Ask:

```http
POST http://localhost:3000/api/ai-guide/ask
Authorization: Bearer <access_token>
Content-Type: application/json
```

```json
{
  "question": "Who was Akhenaten?",
  "topic": "pharaoh"
}
```

Describe:

```http
POST http://localhost:3000/api/ai-guide/describe
Authorization: Bearer <access_token>
Content-Type: application/json
```

```json
{
  "monument_name": "Karnak Temple"
}
```

Identify:

```http
POST http://localhost:3000/api/ai-guide/identify
Authorization: Bearer <access_token>
Content-Type: application/json
```

```json
{
  "monument_name": "Great Pyramid of Giza",
  "question": "When was it built?"
}
```

## AI Classes

The backend mapping is in `backend/utils/classMapping.js` and should match `ai_services/CV_Recognition/model/class_names.json`.

`Amenhotep_III_Tiye` is present in the AI class file but is not currently seeded in the database, so predictions for it return a clean `not_found` scan status until that monument is added.
