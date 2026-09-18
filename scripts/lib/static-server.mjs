import * as http from 'node:http';
import * as fs from 'node:fs';
import * as path from 'node:path';

export const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.cjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.map': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.wasm': 'application/wasm',
};

function normalizePrefix(prefix) {
  if (!prefix.startsWith('/')) {
    prefix = '/' + prefix;
  }
  if (prefix.length > 1 && prefix.endsWith('/')) {
    prefix = prefix.slice(0, -1);
  }
  return prefix;
}

function resolveFileFromDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    const stat = fs.statSync(dirPath);
    if (stat.isDirectory()) {
      const indexPath = path.join(dirPath, 'index.html');
      if (fs.existsSync(indexPath) && fs.statSync(indexPath).isFile()) {
        return indexPath;
      }
    } else if (stat.isFile()) {
      return dirPath;
    }
  }
  return null;
}

export function createStaticServer(options = {}) {
  const rootDir = path.resolve(options.rootDir || process.cwd());
  const fallbackToIndex = !!options.fallbackToIndex;
  const customMimeTypes = { ...MIME_TYPES, ...(options.mimeTypes || {}) };

  const rawRoutes = { ...(options.prefixes || {}), ...(options.routes || {}) };
  const routeEntries = Object.entries(rawRoutes)
    .map(([key, target]) => {
      return {
        prefix: normalizePrefix(key),
        rawKey: key,
        target,
      };
    })
    .sort((a, b) => b.prefix.length - a.prefix.length);

  const server = http.createServer((req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Method Not Allowed');
      return;
    }

    const rawUrl = req.url || '/';
    let urlPath;
    try {
      urlPath = decodeURIComponent(rawUrl.split('?')[0].split('#')[0]);
    } catch {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Bad Request');
      return;
    }

    if (!urlPath.startsWith('/')) {
      urlPath = '/' + urlPath;
    }

    let resolvedFilePath = null;

    for (const route of routeEntries) {
      if (typeof route.target === 'function') {
        if (urlPath === route.prefix || urlPath.startsWith(route.prefix + '/')) {
          const handled = route.target(req, res, { urlPath });
          if (handled || res.writableEnded) {
            return;
          }
        }
        continue;
      }

      if (typeof route.target === 'string') {
        const targetResolved = path.resolve(route.target);

        if (urlPath === route.prefix) {
          const matched = resolveFileFromDirectory(targetResolved);
          if (matched) {
            resolvedFilePath = matched;
            break;
          }
        } else if (urlPath.startsWith(route.prefix + '/')) {
          const subPath = urlPath.slice(route.prefix.length + 1);
          const candidatePath = path.resolve(targetResolved, subPath);

          if (!candidatePath.startsWith(targetResolved)) {
            res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Forbidden');
            return;
          }

          const matched = resolveFileFromDirectory(candidatePath);
          if (matched) {
            resolvedFilePath = matched;
            break;
          }
        }
      }
    }

    if (!resolvedFilePath) {
      const candidatePath = path.resolve(rootDir, '.' + urlPath);
      if (!candidatePath.startsWith(rootDir)) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Forbidden');
        return;
      }

      resolvedFilePath = resolveFileFromDirectory(candidatePath);
    }

    if (!resolvedFilePath && fallbackToIndex) {
      const rootIndex = path.join(rootDir, 'index.html');
      if (fs.existsSync(rootIndex) && fs.statSync(rootIndex).isFile()) {
        resolvedFilePath = rootIndex;
      }
    }

    if (!resolvedFilePath) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`Not found: ${urlPath}`);
      return;
    }

    try {
      const stat = fs.statSync(resolvedFilePath);
      const ext = path.extname(resolvedFilePath).toLowerCase();
      const contentType = customMimeTypes[ext] || 'application/octet-stream';

      const headers = {
        'Content-Type': contentType,
        'Content-Length': stat.size,
        'Cache-Control': 'no-cache',
        ...(options.headers || {}),
      };

      if (req.method === 'HEAD') {
        res.writeHead(200, headers);
        res.end();
        return;
      }

      res.writeHead(200, headers);
      fs.createReadStream(resolvedFilePath).pipe(res);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`Server error: ${err.message}`);
    }
  });

  const sockets = new Set();
  server.on('connection', (socket) => {
    sockets.add(socket);
    socket.once('close', () => sockets.delete(socket));
  });

  server.stop = () =>
    new Promise((resolve, reject) => {
      for (const socket of sockets) {
        socket.destroy();
      }
      sockets.clear();

      server.close((err) => {
        if (err) {
          if (err.code === 'ERR_SERVER_NOT_RUNNING') {
            resolve();
            return;
          }
          reject(err);
        } else {
          resolve();
        }
      });
    });

  return server;
}

export async function startStaticServer(options = {}) {
  const server = createStaticServer(options);
  const port = options.port !== undefined ? options.port : 0;
  const host = options.host || '127.0.0.1';

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => {
      server.removeListener('error', reject);
      resolve();
    });
  });

  const address = server.address();
  const actualPort = typeof address === 'object' && address ? address.port : port;
  const actualHost = typeof address === 'object' && address ? address.address : host;
  const url = `http://${actualHost}:${actualPort}`;

  server.port = actualPort;
  server.host = actualHost;
  server.url = url;

  return {
    server,
    port: actualPort,
    host: actualHost,
    url,
    stop: () => server.stop(),
  };
}
