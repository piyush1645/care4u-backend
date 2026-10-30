import express, { type Application } from 'express';
import cors from 'cors';
import { setupRoutes } from './routes/index.js';
import path from 'path';
import 'dotenv/config';
import cookies from 'cookie-parser';

export const createApp = (): Application => {
  (BigInt.prototype as any).toJSON = function () {
    return this.toString();
  };

  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cors());
  app.set('views', path.join(import.meta.dirname, 'views'));
  app.use(cookies());
  app.use('/api/v1', setupRoutes());

  return app;
};
