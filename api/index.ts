// Vercel serverless entry point.
//
// Vercel runs the app as a serverless function rather than a long-lived
// `app.listen()` server, so we simply re-export the existing Express app.
// All application logic still lives in src/ and is unchanged — local dev
// keeps using src/server.ts (npm run dev), while Vercel imports the app here.
//
// vercel.json rewrites every /api/* request to this function; the Express
// app already mounts its routes under /api, so req.url is handled as-is.
import app from '../src/app';

export default app;
