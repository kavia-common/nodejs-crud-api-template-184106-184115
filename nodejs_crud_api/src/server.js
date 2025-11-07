import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Health check route
// PUBLIC_INTERFACE
app.get('/health', (req, res) => {
  /** Health check endpoint. Returns JSON with status and timestamp. */
  res.json({ status: 'ok', service: 'nodejs-crud-api', time: new Date().toISOString() });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
