// A static server that refuses to be cached.
//
//   node tools/serve.mjs [port]
//
// `npm run serve` is fine for looking at the app. This one is for working on it,
// and the difference is one header. Browsers cache ES modules hard enough that a
// plain reload can serve you the previous version of the model while you are
// staring at the new source — which is how a real bug in this repository stayed
// hidden through several rounds of "that change did nothing". Every response
// here carries `Cache-Control: no-store`.
//
// Node rather than Python because the tests already need Node, and no
// dependencies because the rest of the project has none.

import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PORT = Number(process.argv[2] ?? 8499);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.md': 'text/markdown; charset=utf-8',
};

function resolve(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const target = normalize(join(ROOT, decoded === '/' ? 'index.html' : decoded));
  // Refuse anything that normalises its way out of the project.
  return target === ROOT.slice(0, -1) || target.startsWith(ROOT) ? target : null;
}

const server = createServer(async (req, res) => {
  const path = resolve(req.url);
  if (!path) {
    res.writeHead(403).end('outside the project');
    return;
  }
  try {
    const info = await stat(path);
    if (info.isDirectory()) throw new Error('directory');
    res.writeHead(200, {
      'Content-Type': TYPES[extname(path)] ?? 'application/octet-stream',
      'Content-Length': info.size,
      'Cache-Control': 'no-store',
    });
    createReadStream(path).pipe(res);
  } catch {
    res.writeHead(404, { 'Cache-Control': 'no-store' }).end('not found');
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`heart-lung on http://127.0.0.1:${PORT} — serving ${ROOT} with no-store`);
});
