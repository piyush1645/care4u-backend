import express, { type Application } from 'express'
import cors from 'cors'
// import routes from './routes/index.js'
import path from 'path';

export const createApp = (): Application => {
    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({extended: true}));
    app.use(cors());
    app.set('views',path.join(import.meta.dirname,"views"));
    // app.use('/api/v1',routes);

    return app;
}