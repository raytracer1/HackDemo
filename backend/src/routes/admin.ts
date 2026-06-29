import { FastifyInstance } from 'fastify';
import { query } from '../db/index.js';
import { authenticate } from '../auth/token.js';

async function requireAdmin(authHeader?: string): Promise<boolean> {
  const auth = await authenticate(authHeader);
  if (!auth || auth.role !== 'user') return false;
  return auth.email === process.env.ADMIN_EMAIL;
}

export default async function adminRoutes(fastify: FastifyInstance) {

  /**
   * GET /api/admin/users — list all users
   */
  fastify.get('/api/admin/users', async (request, reply) => {
    if (!await requireAdmin(request.headers.authorization)) {
      return reply.status(403).send({ error: 'Admin access required' });
    }

    const page = parseInt((request.query as any).page || '1', 10);
    const limit = Math.min(parseInt((request.query as any).limit || '50', 10), 100);
    const offset = (page - 1) * limit;

    const countResult = await query(`SELECT COUNT(*) FROM users`);
    const total = parseInt(countResult.rows?.[0]?.count || '0', 10);

    const result = await query(
      `SELECT id, email, name, type, email_verified, credits, created_at, updated_at
       FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset],
    );

    return reply.send({ users: result.rows || [], total, page, limit });
  });

  /**
   * GET /api/admin/transactions — list all transactions (orders)
   */
  fastify.get('/api/admin/transactions', async (request, reply) => {
    if (!await requireAdmin(request.headers.authorization)) {
      return reply.status(403).send({ error: 'Admin access required' });
    }

    const page = parseInt((request.query as any).page || '1', 10);
    const limit = Math.min(parseInt((request.query as any).limit || '50', 10), 100);
    const offset = (page - 1) * limit;

    const countResult = await query(`SELECT COUNT(*) FROM transactions`);
    const total = parseInt(countResult.rows?.[0]?.count || '0', 10);

    const result = await query(
      `SELECT t.*, u.email as user_email
       FROM transactions t
       LEFT JOIN users u ON t.user_id = u.id
       ORDER BY t.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    );

    return reply.send({ transactions: result.rows || [], total, page, limit });
  });

  /**
   * GET /api/admin/demos — list all demos
   */
  fastify.get('/api/admin/demos', async (request, reply) => {
    if (!await requireAdmin(request.headers.authorization)) {
      return reply.status(403).send({ error: 'Admin access required' });
    }

    const page = parseInt((request.query as any).page || '1', 10);
    const limit = Math.min(parseInt((request.query as any).limit || '50', 10), 100);
    const offset = (page - 1) * limit;

    const status = (request.query as any).status as string | undefined;

    let countSql = `SELECT COUNT(*) FROM demos`;
    let dataSql = `SELECT d.*, u.email as user_email
                   FROM demos d LEFT JOIN users u ON d.user_id = u.id`;
    const params: any[] = [];

    if (status) {
      countSql += ` WHERE d.status = $1`;
      dataSql += ` WHERE d.status = $1`;
      params.push(status);
    }

    dataSql += ` ORDER BY d.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

    const countResult = await query(countSql, status ? [status] : []);
    const total = parseInt(countResult.rows?.[0]?.count || '0', 10);

    const result = await query(dataSql, [...params, limit, offset]);

    return reply.send({ demos: result.rows || [], total, page, limit });
  });

  /**
   * GET /api/admin/check — verify current user is admin
   */
  fastify.get('/api/admin/check', async (request, reply) => {
    const ok = await requireAdmin(request.headers.authorization);
    return reply.send({ admin: ok });
  });
}
