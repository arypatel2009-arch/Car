import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { apiRouter } from './src/server/routes.ts';
import { serverConfig, getSystemConfigStatus } from './src/server/config.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = serverConfig.port;

  // Middleware
  app.use(express.json());

  // Mount API router
  app.use('/api', apiRouter);

  // Setup Vite dev middleware or static serving
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    const status = getSystemConfigStatus();
    console.log(`[CareerOS] Server running on port ${PORT}`);
    console.log(`[CareerOS] Supabase status: ${status.supabase.status}`);
    console.log(`[CareerOS] Gemini status:   ${status.gemini.status}`);
    console.log(`[CareerOS] Research status: ${status.research.status} (${status.research.primaryProvider})`);
  });
}

startServer().catch((err) => {
  console.error('[CareerOS] Failed to start server:', err);
  process.exit(1);
});
