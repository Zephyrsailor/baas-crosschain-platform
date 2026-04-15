import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { createReadStream, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = Number(process.env.WEB_PORT || 3310);
const backend = process.env.BACKEND_URL || 'http://localhost:3300';
const publicDir = path.join(__dirname, 'public');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

function sendFile(res, filePath) {
  const ext = path.extname(filePath);
  res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
  createReadStream(filePath).pipe(res);
}

async function proxyApi(req, res, pathname, search) {
  const target = new URL(pathname + search, backend);
  const headers = { ...req.headers, host: target.host };

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);

  const upstream = await fetch(target, {
    method: req.method,
    headers,
    body: chunks.length ? Buffer.concat(chunks) : undefined,
  });

  const body = Buffer.from(await upstream.arrayBuffer());
  const outHeaders = {};
  upstream.headers.forEach((value, key) => {
    if (key.toLowerCase() !== 'content-encoding') outHeaders[key] = value;
  });

  res.writeHead(upstream.status, outHeaders);
  res.end(body);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (url.pathname.startsWith('/api/')) {
      return await proxyApi(req, res, url.pathname, url.search);
    }

    let requestPath = url.pathname === '/' ? '/index.html' : url.pathname;
    const filePath = path.join(publicDir, requestPath);

    if (!filePath.startsWith(publicDir)) {
      res.writeHead(403);
      return res.end('forbidden');
    }

    if (existsSync(filePath)) return sendFile(res, filePath);

    const indexFile = path.join(publicDir, 'index.html');
    const html = await readFile(indexFile, 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(html);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`web server error: ${err.message}`);
  }
});

server.listen(port, () => {
  console.log(`web console listening on http://localhost:${port}`);
  console.log(`proxying /api -> ${backend}`);
});
