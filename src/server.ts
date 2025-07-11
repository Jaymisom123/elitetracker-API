import cors from 'cors';
import 'dotenv/config';
import express from 'express';

import { routes } from '../src/routes/routes';
import { firebaseConfig } from './config/firebase';
import { setupMongo } from './database';

const app = express();

// CORS restrito para http://localhost:5173
app.use(
  cors({
    origin: 'http://localhost:5173',
  })
);

// Initialize Firebase
firebaseConfig.initialize();

setupMongo().then(() => {
  app.use(express.json());
  app.use(routes);

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
});

export default app;
