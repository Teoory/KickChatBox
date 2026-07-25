import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number.parseInt(process.env.PORT || '8787', 10);
const indexPath = path.join(__dirname, 'index.html');
const imageDir = path.join(__dirname, 'images');
const publicBaseUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;

const clients = new Set();

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': '*',
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function broadcast(payload) {
  const message = JSON.stringify(payload);
  for (const client of clients) {
    if (client.readyState === client.OPEN) {
      client.send(message);
    }
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Kick-Webhook-Secret',
    });
    res.end();
    return;
  }

  if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html' || url.pathname === '/overlay')) {
    const html = await readFile(indexPath, 'utf8');
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    });
    res.end(html);
    return;
  }

  if (req.method === 'GET' && url.pathname.startsWith('/images/')) {
    const filename = path.basename(url.pathname);
    if (!/^[a-z]+\.png$/i.test(filename)) {
      res.writeHead(404).end();
      return;
    }

    try {
      const image = await readFile(path.join(imageDir, filename));
      res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400' });
      res.end(image);
    } catch {
      res.writeHead(404).end();
    }
    return;
  }
  if (req.method === 'GET' && url.pathname === '/auth/callback') {
    const html = await readFile(indexPath, 'utf8');
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    });
    res.end(html);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/webhook') {
    const html = `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Kick Webhook Endpoint</title>
  <style>
    body { margin: 0; font-family: system-ui, sans-serif; background: #0b0d12; color: #eef2ff; display: grid; min-height: 100vh; place-items: center; }
    .card { max-width: 760px; padding: 24px; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; background: rgba(255,255,255,0.04); }
    h1 { margin-top: 0; }
    code { background: rgba(255,255,255,0.08); padding: 2px 6px; border-radius: 8px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Webhook endpoint aktif</h1>
    <p>Bu adres POST istekleri bekler: <code>/webhook</code>.</p>
    <p>Kick panelinde webhook URL olarak <code>${publicBaseUrl}/webhook</code> kullan.</p>
  </div>
</body>
</html>`;
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    });
    res.end(html);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/health') {
    sendJson(res, 200, {
      ok: true,
      wsClients: clients.size,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/webhook') {
    const raw = await readBody(req);
    let payload = null;

    try {
      payload = raw ? JSON.parse(raw) : null;
    } catch {
      payload = { raw };
    }

    broadcast({
      kind: 'chat',
      source: 'Kick webhook',
      receivedAt: new Date().toISOString(),
      payload,
      headers: {
        messageId: req.headers['kick-event-message-id'] || null,
        subscriptionId: req.headers['kick-event-subscription-id'] || null,
        signature: req.headers['kick-event-signature'] || null,
        timestamp: req.headers['kick-event-message-timestamp'] || null,
        eventType: req.headers['kick-event-type'] || null,
        eventVersion: req.headers['kick-event-version'] || null,
      },
    });

    sendJson(res, 200, { ok: true });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not found');
});

const wss = new WebSocketServer({ server });

wss.on('connection', (socket) => {
  clients.add(socket);

  socket.send(JSON.stringify({
    kind: 'system',
    message: 'Relay bağlantısı kuruldu.',
  }));

  socket.on('close', () => {
    clients.delete(socket);
  });

  socket.on('message', (raw) => {
    const text = Buffer.isBuffer(raw) ? raw.toString('utf8') : String(raw);
    try {
      const payload = JSON.parse(text);
      broadcast(payload);
    } catch {
      broadcast({ kind: 'system', message: text });
    }
  });
});

server.listen(PORT, () => {
  const websocketUrl = publicBaseUrl.startsWith('https://')
    ? publicBaseUrl.replace('https://', 'wss://')
    : publicBaseUrl.replace('http://', 'ws://');

  console.log(`Kick Chat Box running at ${publicBaseUrl}`);
  console.log(`Webhook endpoint: ${publicBaseUrl}/webhook`);
  console.log(`WebSocket relay: ${websocketUrl}`);
});
