# Grand Egyptian Museum Tourist Guide Backend

Node.js/Express backend gateway for the Grand Egyptian Museum Tourist Guide project.

The backend exposes REST APIs for authentication, monuments, artifact scanning, AI guide Q&A, scan history, gallery, favorites, reviews, and user profile management. It connects to PostgreSQL with Sequelize and forwards AI requests to the separate local AI services.

## Services

```text
frontend -> backend -> PostgreSQL
frontend -> backend -> CV Recognition service
frontend -> backend -> Chatbot/RAG service
```

The frontend should call only the backend API at:

```text
http://localhost:3000/api
```

AI services are internal backend dependencies:

```text
CV Recognition: http://localhost:8000
Chatbot/RAG:    http://localhost:8001
```

## Tech Stack

- Node.js
- Express.js
- PostgreSQL
- Sequelize
- JWT authentication
- Multer uploads
- Axios and FormData for AI service calls
- Nodemailer for password reset email
- EJS views for simple server-rendered pages

## Folder Structure

```text
backend/
|-- app.js
|-- server.js
|-- config/
|-- controllers/
|-- middleware/
|-- models/
|-- routes/
|-- seed/
|-- uploads/
|-- utils/
|-- views/
|-- Dockerfile
|-- package.json
`-- .env.example
```

## Environment

Create `backend/.env` from `.env.example`:

```powershell
cd D:\Graduation\backend
Copy-Item .env.example .env
```

Required local values:

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
MAX_UPLOAD_SIZE_MB=10
CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
GROQ_API_KEY=
GROQ_TITLE_MODEL=llama-3.1-8b-instant
GROQ_TITLE_TIMEOUT_MS=4000
EMAIL_HOST=
EMAIL_PORT=
EMAIL_SECURE=false
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM="Grand Egyptian Museum Tourist Guide <no-reply@gem-guide.com>"
```

For Docker, the root `docker-compose.yml` overrides internal service URLs:

```env
DB_HOST=postgres
AI_SERVICE_URL=http://cv-recognition:8000
RAG_SERVICE_URL=http://chatbot-llm:8001
```

## Run Locally

Start PostgreSQL locally first on port `5432`.

Create the database if it does not exist:

```powershell
psql -U postgres -c "CREATE DATABASE gem_museum;"
```

Install backend dependencies:

```powershell
cd D:\Graduation\backend
npm install
```

Seed the database:

```powershell
npm run seed
```

Start the backend:

```powershell
npm run dev
```

Backend URL:

```text
http://localhost:3000
```

API base URL:

```text
http://localhost:3000/api
```

## Required Local Service Order

Use separate PowerShell terminals:

1. PostgreSQL on `localhost:5432`
2. CV Recognition on `http://localhost:8000`
3. Chatbot/RAG on `http://localhost:8001`
4. Backend on `http://localhost:3000`
5. Frontend on `http://localhost:5173`

## Scripts

```powershell
npm run dev
```

Starts the backend with `nodemon`.

```powershell
npm start
```

Starts the backend with `node server.js`.

```powershell
npm run seed
```

Seeds languages, monuments, translations, and monument images.

## Main API Endpoints

### Auth

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
POST /api/auth/forgot-password
POST /api/auth/verify-reset-otp
POST /api/auth/reset-password
```

Login/register return:

```json
{
  "access_token": "...",
  "refresh_token": "...",
  "user": {
    "id": "...",
    "full_name": "User Name",
    "email": "user@example.com"
  }
}
```

Use protected APIs with:

```http
Authorization: Bearer <access_token>
```

### Monuments

```http
GET /api/monuments
GET /api/monuments/:id
```

Optional language header:

```http
Accept-Language: en
```

### Artifact Scan

```http
POST /api/scan/artifact
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

Form field:

```text
image: <image file>
```

Maximum image size is controlled by:

```env
MAX_UPLOAD_SIZE_MB=10
```

If the image is too large, the backend returns:

```json
{
  "success": false,
  "error": "IMAGE_TOO_LARGE",
  "message": "Image is too large. Maximum allowed size is 10MB."
}
```

Flow:

```text
Image upload
-> backend /api/scan/artifact
-> CV Recognition /predict
-> class mapping
-> PostgreSQL monument lookup
-> optional Chatbot/RAG description
-> scan session saved
-> response returned to frontend
```

Example response:

```json
{
  "session": {},
  "ai_result": {
    "class_name": "Akhenaten",
    "confidence": 0.571
  },
  "mapped_monument_name": "Akhenaten",
  "monument": {},
  "ai_guide_description": "...",
  "message": "Artifact recognized successfully."
}
```

### Scan History

```http
GET /api/scan/history
Authorization: Bearer <access_token>
```

### AI Guide

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

Protected:

```text
/ask
/conversations
/conversations/:id/messages
/conversations/:id/title
/conversations/:id
/describe
/identify
```

Example ask request:

```json
{
  "question": "Who was Akhenaten?",
  "topic": "pharaoh",
  "conversation_id": "optional_existing_conversation_uuid"
}
```

If `conversation_id` is omitted, the backend creates a new chat conversation, generates a short title, stores the user message and assistant response in PostgreSQL, and returns:

```json
{
  "answer": "Akhenaten was...",
  "sources": [],
  "latency_ms": 1234,
  "conversation_id": "conversation_uuid",
  "conversation_title": "Akhenaten History"
}
```

Conversation title generation uses Groq when `GROQ_API_KEY` is configured. If that fails or the key is missing, the backend uses a local two-word fallback from the first question.

Get conversations:

```http
GET /api/ai-guide/conversations
Authorization: Bearer <access_token>
```

Get conversation messages:

```http
GET /api/ai-guide/conversations/:id/messages
Authorization: Bearer <access_token>
```

Rename conversation:

```http
PATCH /api/ai-guide/conversations/:id/title
Authorization: Bearer <access_token>
Content-Type: application/json
```

```json
{
  "title": "New Title"
}
```

Delete conversation:

```http
DELETE /api/ai-guide/conversations/:id
Authorization: Bearer <access_token>
```

Example describe request:

```json
{
  "monument_name": "Mask of Tutankhamun"
}
```

Example identify request:

```json
{
  "monument_name": "Great Pyramid of Giza",
  "question": "When was it built?"
}
```

### Gallery

```http
GET    /api/gallery
POST   /api/gallery
DELETE /api/gallery/:id
```

Protected with JWT.

Example add request:

```json
{
  "monument_id": "<monument_uuid>",
  "session_id": 1,
  "image_url": "/uploads/example.jpg"
}
```

### Favorites

```http
GET    /api/favorites
POST   /api/favorites
DELETE /api/favorites/:id
```

Protected with JWT.

Example add request:

```json
{
  "monument_id": "<monument_uuid>"
}
```

### Reviews

```http
GET    /api/reviews/monument/:monumentId
POST   /api/reviews
DELETE /api/reviews/:id
```

`POST` and `DELETE` are protected.

Example add/update review:

```json
{
  "monument_id": "<monument_uuid>",
  "rating": 5,
  "comment": "Excellent artifact."
}
```

### User Profile

```http
GET /api/users/profile
PUT /api/users/profile
```

Protected with JWT.

Example update:

```json
{
  "full_name": "Updated User Name"
}
```

## Postman Quick Start

1. Register or login.
2. Copy `access_token`.
3. Add this header to protected requests:

```http
Authorization: Bearer <access_token>
```

Login:

```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json
```

```json
{
  "email": "test@example.com",
  "password": "123456789"
}
```

Get monuments:

```http
GET http://localhost:3000/api/monuments
```

Scan artifact:

```http
POST http://localhost:3000/api/scan/artifact
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

Form-data:

```text
image: <file>
```

Ask AI Guide:

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

## Docker

From the project root:

```powershell
cd D:\Graduation
$env:GROQ_API_KEY="your_groq_key_here"
docker compose up -d --build
docker compose exec backend npm run seed
docker compose ps
```

Backend container URL from host:

```text
http://localhost:3000
```

## Health Checks

```powershell
curl.exe http://localhost:3000
curl.exe http://localhost:3000/api/monuments
curl.exe http://localhost:3000/api/ai-guide/health
curl.exe http://localhost:8000/health
curl.exe http://localhost:8001/health
```

## Notes

- The backend acts as the gateway for both AI services.
- Frontend clients should not call `8000` or `8001` directly.
- `AI_SERVICE_URL` controls the CV Recognition service URL.
- `RAG_SERVICE_URL` controls the Chatbot/RAG service URL.
- If either AI service is temporarily down, backend controllers return clean error messages where possible.
- Uploaded files are stored under `backend/uploads/`.
- Upload size is controlled by `MAX_UPLOAD_SIZE_MB`; the default is `10`.
- Do not commit real secrets or API keys.
