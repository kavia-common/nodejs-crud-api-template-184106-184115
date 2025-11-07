import { createApp } from './app.js';
import config from './config/env.js';

// Create configured app
const app = createApp();

// Start server
app.listen(config.port, () => {
  console.log(`Server listening on port ${config.port}`);
});
