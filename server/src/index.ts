import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config';
import { checkDatabaseConnection } from './db/client';
import webhookRoutes from './routes/webhook.routes';
import agentRoutes from './routes/agent.routes';
import customerRoutes from './routes/customer.routes';
import authRoutes from './routes/auth.routes';

const app = express();

// Enable CORS
app.use(cors());

// Parse JSON bodies and preserve rawBody buffer for HMAC-SHA256 signature verification
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get('/api/health', async (_req: Request, res: Response) => {
  const dbOk = await checkDatabaseConnection();
  res.json({
    status: 'ok',
    brand: config.brand.name,
    database: dbOk ? 'connected' : 'disconnected',
    llmProvider: config.groqApiKey ? 'groq' : config.openaiApiKey ? 'openai' : config.geminiApiKey ? 'gemini' : 'fallback-kb-engine',
    timestamp: new Date().toISOString(),
  });
});

// Knowledge Base info endpoint (public inspection for reviewers)
app.get('/api/knowledge-base', (_req: Request, res: Response) => {
  res.json({
    brand: config.brand,
    knowledgeBase: config.knowledgeBase,
  });
});

// Mount Routes
app.use('/webhook', webhookRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/customer', customerRoutes);

// In production, serve the built React client if available
const clientBuildPath = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientBuildPath));

app.get('*', (req: Request, res: Response, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/webhook')) {
    return next();
  }
  const indexHtml = path.join(clientBuildPath, 'index.html');
  res.sendFile(indexHtml, (err) => {
    if (err) {
      res.status(404).send('Verdant & Co Support API is running. Client not built yet.');
    }
  });
});

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: any) => {
  console.error('💥 Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err?.message || 'An unexpected error occurred',
  });
});

// Start Server
const server = app.listen(config.port, () => {
  console.log(`=======================================================`);
  console.log(`🌿 Verdant & Co AI Support Server`);
  console.log(`🚀 Running at: http://localhost:${config.port}`);
  console.log(`📡 Webhook endpoint: http://localhost:${config.port}/webhook`);
  console.log(`🔒 HMAC Secret: ${config.webhookSecret}`);
  console.log(`=======================================================`);
  checkDatabaseConnection();
});

export default app;

