#!/usr/bin/env node
/**
 * Local development server for the portfolio.
 *
 *   node dev-server.js            → http://localhost:4173
 *   PORT=8080 node dev-server.js  → http://localhost:8080
 *
 * Serves the site statically AND exposes a tiny write endpoint so the admin
 * panel can save straight into data/projects.json instead of making you
 * download the file and move it by hand.
 *
 * This is a LOCAL TOOL ONLY. It binds to 127.0.0.1 and refuses any request
 * that does not originate from this machine. Do not deploy it — your host
 * (Netlify, Vercel, GitHub Pages, …) serves the static files by itself and
 * has no use for this script.
 */

'use strict';

const http = require('http');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 4173;
const HOST = '127.0.0.1';
const PROJECTS_FILE = path.join(ROOT, 'data', 'projects.json');
const MAX_BODY = 512 * 1024; // 512 KB is far more than any project list needs

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
  '.webmanifest': 'application/manifest+json',
  '.woff2': 'font/woff2',
};

const json = (res, code, payload) => {
  const body = JSON.stringify(payload);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
  });
  res.end(body);
};

/** Only ever answer requests that came from this machine. */
function isLocal(req) {
  const addr = req.socket.remoteAddress || '';
  return addr === '127.0.0.1' || addr === '::1' || addr === '::ffff:127.0.0.1';
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(new Error('Body too large'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

/** Reject anything that isn't a plausible project list before touching disk. */
function validate(list) {
  if (!Array.isArray(list)) return 'Payload must be an array';
  if (list.length > 200) return 'Too many projects';
  for (const p of list) {
    if (!p || typeof p !== 'object') return 'Each project must be an object';
    if (typeof p.name !== 'string' || !p.name.trim()) return 'Each project needs a name';
    if (p.tags && !Array.isArray(p.tags)) return `"${p.name}" has a non-array tags field`;
  }
  const featured = list.filter((p) => p.featured).length;
  if (featured > 1) return 'Only one project may be featured';
  return null;
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function writeProjects(list) {
  const payload = JSON.stringify(list, null, 2) + '\n';
  await fsp.mkdir(path.dirname(PROJECTS_FILE), { recursive: true });

  // Preferred path: write a sibling temp file and rename over the target, so
  // an interrupted write can never leave a half-truncated projects.json.
  const tmp = PROJECTS_FILE + '.tmp';
  try {
    await fsp.writeFile(tmp, payload, 'utf8');

    for (let attempt = 0; ; attempt++) {
      try {
        await fsp.rename(tmp, PROJECTS_FILE);
        return;
      } catch (err) {
        // Windows raises EPERM/EBUSY when an editor, indexer or antivirus has
        // the destination open — having the file open in VS Code is enough.
        // Retry briefly, then give up on atomicity and write in place, which
        // succeeds against a merely-open file.
        if (!['EPERM', 'EACCES', 'EBUSY'].includes(err.code)) throw err;
        if (attempt >= 3) {
          await fsp.writeFile(PROJECTS_FILE, payload, 'utf8');
          return;
        }
        await wait(60 * (attempt + 1));
      }
    }
  } finally {
    // Never leave a stray .tmp lying around in the repo.
    await fsp.rm(tmp, { force: true }).catch(() => {});
  }
}

function serveStatic(req, res, urlPath) {
  const filePath = path.join(ROOT, urlPath);
  const rel = path.relative(ROOT, filePath);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      fs.readFile(path.join(ROOT, '404.html'), (e2, b2) => {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(e2 ? 'Not found' : b2);
      });
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': TYPES[ext] || 'application/octet-stream',
      // Never cache during development — you want your last save, every time.
      'Cache-Control': 'no-store',
    });
    fs.createReadStream(filePath).pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  if (!isLocal(req)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);

  // Lets admin.html discover that file-writing is available.
  if (urlPath === '/__api/health') {
    json(res, 200, { dev: true, file: path.relative(ROOT, PROJECTS_FILE).replace(/\\/g, '/') });
    return;
  }

  if (urlPath === '/__api/projects') {
    if (req.method !== 'POST') {
      json(res, 405, { ok: false, error: 'Use POST' });
      return;
    }
    // Requiring JSON forces a CORS preflight for cross-origin callers, which
    // we never answer — so only this site's own admin page can write.
    if (!String(req.headers['content-type'] || '').includes('application/json')) {
      json(res, 415, { ok: false, error: 'Content-Type must be application/json' });
      return;
    }

    try {
      const raw = await readBody(req);
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        json(res, 400, { ok: false, error: 'Body is not valid JSON' });
        return;
      }

      const problem = validate(parsed);
      if (problem) {
        json(res, 400, { ok: false, error: problem });
        return;
      }

      await writeProjects(parsed);
      console.log(`  ✓ wrote data/projects.json (${parsed.length} projects)`);
      json(res, 200, { ok: true, count: parsed.length });
    } catch (err) {
      console.error('  ✗ write failed:', err.message);
      json(res, 500, { ok: false, error: err.message });
    }
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405).end('Method not allowed');
    return;
  }

  serveStatic(req, res, urlPath === '/' ? '/index.html' : urlPath);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n  Port ${PORT} is already in use.`);
    console.error(`  Close the other server, or run:  PORT=4174 node dev-server.js\n`);
    process.exit(1);
  }
  throw err;
});

server.listen(PORT, HOST, () => {
  console.log(`\n  Portfolio dev server`);
  console.log(`  ────────────────────────────────────────────`);
  console.log(`  Site   http://localhost:${PORT}/`);
  console.log(`  Admin  http://localhost:${PORT}/admin.html`);
  console.log(`\n  Admin edits save directly into data/projects.json.`);
  console.log(`  Press Ctrl+C to stop.\n`);
});
