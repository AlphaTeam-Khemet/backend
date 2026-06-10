const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || corsOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Backend gateway:
// - cv-recognition handles computer vision artifact recognition.
// - chatbot-llm handles Groq + ChromaDB historical Q&A.
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/monuments', require('./routes/monuments'));
app.use('/api/favorites', require('./routes/favorites'));
app.use('/api/gallery', require('./routes/gallery'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/scan', require('./routes/scan'));
app.use('/api/ai-guide', require('./routes/aiGuideRoutes'));
app.use('/', require('./routes/web'));

module.exports = app;
