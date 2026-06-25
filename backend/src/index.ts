import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import demoRoutes from './routes/demo.js';

const PORT = parseInt(process.env.PORT || '3001', 10);

async function main() {
  const fastify = Fastify({
    logger: true,
    bodyLimit: 100 * 1024 * 1024, // 100MB for screenshot uploads
  });

  // Plugins
  await fastify.register(cors, {
    origin: true, // Allow extension + frontend
  });
  await fastify.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB per file
      files: 50, // up to 50 screenshots
    },
  });

  // Routes
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
