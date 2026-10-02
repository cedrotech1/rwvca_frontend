import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(root, 'dist');
const port = Number(process.env.PORT || 3001);
const apiTarget = new URL(process.env.API_PROXY_TARGET || 'http://127.0.0.1:3000');

const types = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function send(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type });
  res.end(body);
}

function proxyApi(req, res) {
  const headers = { ...req.headers, host: apiTarget.host };
  const upstream = http.request(
    {
      protocol: apiTarget.protocol,
      hostname: apiTarget.hostname,
      port: apiTarget.port,
      path: req.url,
      method: req.method,
      headers,
    },
    (upstreamRes) => {
      res.writeHead(upstreamRes.statusCode || 502, upstreamRes.headers);
      upstreamRes.pipe(res);
    }
  );
  upstream.on('error', () => {
    send(res, 502, JSON.stringify({ success: false, message: 'API unavailable' }), 'application/json; charset=utf-8');
  });
  req.pipe(upstream);
}

function serveStatic(req, res) {
  const requestPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const relative = requestPath === '/' ? 'index.html' : requestPath.replace(/^\/+/, '');
  const filePath = path.normalize(path.join(distDir, relative));
  if (!filePath.startsWith(distDir)) {
    send(res, 403, 'Forbidden');
    return;
  }

  fs.readFile(filePath, (error, body) => {
    if (!error) {
      send(res, 200, body, types[path.extname(filePath)] || 'application/octet-stream');
      return;
    }
    fs.readFile(path.join(distDir, 'index.html'), (indexError, indexBody) => {
      if (indexError) {
        send(res, 503, 'Frontend build is missing. Run npm run build.');
        return;
      }
      send(res, 200, indexBody, types['.html']);
    });
  });
}

const server = http.createServer((req, res) => {
  const pathname = new URL(req.url || '/', 'http://localhost').pathname;
  if (pathname === '/api' || pathname.startsWith('/api/')) {
    proxyApi(req, res);
    return;
  }
  serveStatic(req, res);
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Frontend on http://0.0.0.0:${port}, API proxy ${apiTarget.origin}`);
});
