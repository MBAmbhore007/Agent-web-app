import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { config } from '../config';

export interface RequestWithRawBody extends Request {
  rawBody?: Buffer;
}

export function verifyWebhookSignature(
  req: RequestWithRawBody,
  res: Response,
  next: NextFunction
): void {
  // Allow bypassing signature verification in local development ONLY if explicitly configured
  if (process.env.SKIP_WEBHOOK_VERIFICATION === 'true') {
    return next();
  }

  const signatureHeader = req.header('X-Signature') || req.header('x-signature');

  if (!signatureHeader) {
    res.status(401).json({
      error: 'Missing X-Signature header',
      expectedHeaderFormat: 'sha256=<hex_hmac_hash>',
    });
    return;
  }

  const parts = signatureHeader.split('=');
  const signatureHex = parts.length === 2 && parts[0] === 'sha256' ? parts[1] : parts[0];

  if (!req.rawBody) {
    res.status(500).json({ error: 'Raw request body unavailable for signature verification' });
    return;
  }

  const secret = config.webhookSecret;
  const computedHex = crypto
    .createHmac('sha256', secret)
    .update(req.rawBody)
    .digest('hex');

  const sigBuffer = Buffer.from(signatureHex, 'hex');
  const compBuffer = Buffer.from(computedHex, 'hex');

  if (sigBuffer.length !== compBuffer.length || !crypto.timingSafeEqual(sigBuffer, compBuffer)) {
    console.warn(`❌ Webhook signature verification failed. Computed: ${computedHex}, Received: ${signatureHex}`);
    res.status(401).json({
      error: 'Invalid signature',
      message: 'HMAC-SHA256 signature verification failed. Verify secret verdant-demo-secret-2026',
    });
    return;
  }

  next();
}

