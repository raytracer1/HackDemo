import { FastifyInstance } from 'fastify';
import { authenticate } from '../auth/token.js';
import { query } from '../db/index.js';

const PACK_PRICE = 9.90;
const PAYPAL_API = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

async function getAccessToken(): Promise<string> {
  const resp = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(
        `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
      ).toString('base64'),
    },
    body: 'grant_type=client_credentials',
  });
  const data = await resp.json() as any;
  if (!resp.ok) throw new Error(`PayPal auth failed: ${JSON.stringify(data)}`);
  return data.access_token;
}

export default async function paypalRoutes(fastify: FastifyInstance) {

  /**
   * POST /api/paypal/create-order
   * Creates a PayPal order for the $9.90 pack.
   */
  fastify.post('/api/paypal/create-order', async (request, reply) => {
    const auth = await authenticate(request.headers.authorization);
    if (!auth || auth.role !== 'user') {
      return reply.status(401).send({ error: 'Authentication required.' });
    }

    try {
      const accessToken = await getAccessToken();
      const resp = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [{
            amount: {
              currency_code: 'USD',
              value: PACK_PRICE.toFixed(2),
            },
            description: 'HackDemo AI Narration Pack',
          }],
        }),
      });
      const order = await resp.json() as any;
      if (!resp.ok) throw new Error(`PayPal create order failed: ${JSON.stringify(order)}`);

      return reply.send({ id: order.id });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  /**
   * POST /api/paypal/capture-order
   * Captures a PayPal order and adds credits to the user's balance.
   */
  fastify.post('/api/paypal/capture-order', async (request, reply) => {
    const auth = await authenticate(request.headers.authorization);
    if (!auth || auth.role !== 'user') {
      return reply.status(401).send({ error: 'Authentication required.' });
    }

    const { orderId } = request.body as any;
    if (!orderId) return reply.status(400).send({ error: 'Missing orderId' });

    try {
      const accessToken = await getAccessToken();
      const resp = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      const capture = await resp.json() as any;
      console.log('[PayPal] Capture response:', JSON.stringify(capture).slice(0, 500));
      if (!resp.ok) {
        console.error('[PayPal] Capture failed:', capture);
        throw new Error(`PayPal capture failed: ${capture.name || 'UNKNOWN'} — ${capture.message || JSON.stringify(capture)}`);
      }

      if (capture.status === 'COMPLETED') {
        console.log('[PayPal] Adding credits for user:', auth.sub, 'email:', auth.email);

        // Add credits
        const updateResult = await query(
          `UPDATE users SET credits = credits + $1, updated_at = now() WHERE id = $2`,
          [PACK_PRICE, auth.sub],
        );
        console.log('[PayPal] UPDATE result:', updateResult.rowCount, 'rows affected');

        // Record transaction
        await query(
          `INSERT INTO transactions (id, user_id, type, amount, description, paypal_order_id)
           VALUES ($1, $2, 'purchase', $3, $4, $5)`,
          [crypto.randomUUID(), auth.sub, PACK_PRICE, 'PayPal top-up — $' + PACK_PRICE.toFixed(2), orderId],
        );

        console.log(`[PayPal] $${PACK_PRICE} added to user ${auth.sub}`);
      }

      return reply.send({ status: capture.status });
    } catch (err: any) {
      console.error('[PayPal] DB error:', err.message, err.stack);
      return reply.status(500).send({ error: err.message });
    }
  });
}
