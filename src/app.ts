import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import apiRouter from './routes';
import { errorHandler } from './middleware/error.middleware';

const app = express();

// Security Middlewares
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

// Logging Middleware
app.use(morgan('dev'));

// Body Parser Middlewares
// Limit raised: the Wave Tracker stores whole quarter datasets as one JSON blob via /api/kv.
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Serve static HTML frontend files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Root Route & Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Marketing Dashboard API is operational',
    timestamp: new Date().toISOString(),
  });
});

// API Routes Aggregator
app.use('/api', apiRouter);

// Fallback so /wave-tracker (and any sub-path under it) still loads the
// single-page app - scoped to /wave-tracker rather than every path, so this
// project can host other things at the domain root later without the app
// swallowing those routes too.
app.get(['/wave-tracker', '/wave-tracker/*'], (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/wave-tracker/index.html'));
});

// Global Centralized Error Handling Middleware
app.use(errorHandler);

export default app;