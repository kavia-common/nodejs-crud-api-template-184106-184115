import dotenv from 'dotenv';
import { createApp } from './app.js';

// Load environment variables from .env
dotenv.config();

// Create configured app
const app = createApp();

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
