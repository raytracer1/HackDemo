import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Auth } from '@auth/core';
import { authConfig, AUTH_URL } from './index.js';

/**
 * Convert a Fastify request into a standard Web Request.
 * Uses AUTH_URL as the base so that Auth.js constructs the correct
 * public-facing callback URLs (important when running behind Vite proxy).
 */
async function toWebRequest(request: FastifyRequest): Promise<Request> {
  const url = new URL(request.url, AUTH_URL);

  // Build standard Headers from Fastify's headers
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      for (const v of value) headers.append(key, String(v));
    } else {
      headers.set(key, String(value));
    }
  }

  // For POST/PUT, pass the body through to Auth.js in the format it expects.
  let body: BodyInit | undefined;
  if (request.method === 'POST' || request.method === 'PUT') {
    const raw = request.body;
    const contentType = (request.headers['content-type'] as string) || '';

    if (typeof raw === 'string') {
      body = raw;
    } else if (contentType.includes('application/x-www-form-urlencoded') && raw != null) {
      // @fastify/formbody parsed the form data into an object.
      // Reconstruct it as URLSearchParams so Auth.js can parse it correctly.
      body = new URLSearchParams(raw as Record<string, string>).toString();
    } else if (raw != null) {
      body = JSON.stringify(raw);
    }
  }

  return new Request(url, { method: request.method, headers, body });
}

/**
 * Apply a Web Response to a Fastify reply.
 */
async function applyResponse(reply: FastifyReply, response: Response) {
  // Copy headers (skip content-encoding to avoid double-compression)
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() !== 'content-encoding') {
      reply.header(key, value);
    }
  });

  // Handle redirects
  if (
    response.status >= 300 &&
    response.status < 400 &&
    response.headers.has('location')
  ) {
    reply.header('location', response.headers.get('location')!);
    return reply.status(response.status).send('');
  }

  const contentType = response.headers.get('content-type') || '';
  const body = await response.text();

  reply.status(response.status);

  if (contentType.includes('application/json')) {
    try {
      return reply.send(JSON.parse(body));
    } catch {
      return reply.send(body);
    }
  }

  return reply.send(body);
}

export default async function authRoutes(fastify: FastifyInstance) {
  // Accept form-encoded bodies (for OAuth sign-in POST) as raw strings.
  // Auth.js parses the body itself — we just pass it through.
  fastify.addContentTypeParser(
    'application/x-www-form-urlencoded',
    { parseAs: 'string' },
    (_req, body, done) => done(null, body),
  );

  // Catch-all: forward every /api/auth/* call to the Auth.js handler function
  fastify.route({
    method: ['GET', 'POST'],
    url: '/api/auth/*',
    handler: async (request, reply) => {
      const webRequest = await toWebRequest(request);
      const response = await Auth(webRequest, authConfig);
      return applyResponse(reply, response);
    },
  });
}
