import crypto from 'crypto';
import http from 'http';
import https from 'https';
import { URL } from 'url';

const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:5000/webhook';
const SECRET = process.env.WEBHOOK_SECRET || 'verdant-demo-secret-2026';

const samplePayload = {
  event_id: `evt_${Math.random().toString(36).substring(2, 10)}`,
  type: 'message.received',
  brand_id: 'verdant-co',
  timestamp: new Date().toISOString(),
  customer: {
    id: 'cust_1042',
    name: 'Aisha Khan',
    phone: '+919800000001',
  },
  message: {
    id: `msg_${Math.random().toString(36).substring(2, 9)}`,
    type: 'text',
    text: process.argv[2] || "Hi, my order #4471 hasn't arrived yet. Can I change the delivery address?",
  },
};

const rawBody = JSON.stringify(samplePayload);

// Compute HMAC-SHA256
const hmac = crypto.createHmac('sha256', SECRET).update(rawBody).digest('hex');
const signatureHeader = `sha256=${hmac}`;

console.log('--------------------------------------------------');
console.log('📡 Sending Test Webhook Request');
console.log(`URL: ${WEBHOOK_URL}`);
console.log(`Secret: ${SECRET}`);
console.log(`X-Signature: ${signatureHeader}`);
console.log('Payload:', JSON.stringify(samplePayload, null, 2));
console.log('--------------------------------------------------');

const parsedUrl = new URL(WEBHOOK_URL);
const isHttps = parsedUrl.protocol === 'https:';
const client = isHttps ? https : http;

const options = {
  hostname: parsedUrl.hostname,
  port: parsedUrl.port || (isHttps ? 443 : 80),
  path: parsedUrl.pathname + parsedUrl.search,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(rawBody),
    'X-Signature': signatureHeader,
  },
};

const req = client.request(options, (res) => {
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  res.on('end', () => {
    console.log(`\n✅ Response Status: ${res.statusCode} ${res.statusMessage}`);
    try {
      console.log('Response Body:', JSON.stringify(JSON.parse(responseData), null, 2));
    } catch {
      console.log('Response Body:', responseData);
    }
  });
});

req.on('error', (err) => {
  console.error('\n❌ Webhook Request Error:', err.message);
});

req.write(rawBody);
req.end();

