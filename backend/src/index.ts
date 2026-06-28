import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import demoRoutes from './routes/demo.js';
import authRoutes from './auth/routes.js';
import paypalRoutes from './routes/paypal.js';
import registerRoutes from './auth/register.js';

const PORT = parseInt(process.env.PORT || '3001', 10);

async function main() {
  const fastify = Fastify({
    logger: true,
    bodyLimit: 100 * 1024 * 1024, // 100MB for screenshot uploads
  });

  // CORS: in production, only allow the configured frontend origin.
  // In dev, origin:true reflects whatever origin the browser sends.
  const frontendUrl = process.env.FRONTEND_URL;
  const allowedOrigins = frontendUrl
    ? [
        frontendUrl,
        frontendUrl.replace('://', '://www.'),  // also allow www subdomain
        'chrome-extension://*',
        'moz-extension://*',
      ]
    : true;
  await fastify.register(cors, {
    origin: allowedOrigins,
    credentials: true,
  });
  await fastify.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB per file
      files: 50, // up to 50 screenshots
    },
  });

  // Routes
  await fastify.register(registerRoutes);
  await fastify.register(authRoutes);
  await fastify.register(paypalRoutes);
  await fastify.register(demoRoutes);

  // Health check
  fastify.get('/health', async () => ({ status: 'ok' }));

  // Start
  try {
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`[HackDemo Backend] Running on http://localhost:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

main();
