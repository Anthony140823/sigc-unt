const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const port = Number(process.env.PORT || 3100);

const buildRoot = path.join(__dirname, '.next');
const appRoot = path.join(buildRoot, 'server', 'app');
const staticRoot = path.join(buildRoot, 'static');
const publicRoot = path.join(__dirname, 'public');

function exists(filePath) {
  try {
    fs.accessSync(filePath);
    return true;
  } catch {
    return false;
  }
}

if (!exists(buildRoot) || !exists(appRoot) || !exists(staticRoot)) {
  console.error('No se encontró un build listo para servir.');
  console.error('Se esperaba:', buildRoot);
  console.error('Asegúrate de tener generado el build en frontend/.next-prod.');
  process.exit(1);
}

const mimeByExt = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

function send(res, statusCode, body, headers = {}) {
  res.writeHead(statusCode, { 'Cache-Control': 'no-store', ...headers });
  res.end(body);
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeByExt[ext] || 'application/octet-stream';

  if (ext === '.html') {
    try {
      const original = fs.readFileSync(filePath, 'utf8');
      const injected = original.replace(
        '</head>',
        `<style id="unt-logo-style">
.min-h-screen.bg-gradient-to-br.from-blue-900.via-blue-800.to-blue-700 .inline-flex.items-center.justify-center.w-16.h-16.bg-white\\/10.rounded-2xl.mb-4{
  background-color:#fff!important;
  background-image:url('/logo-unt.png')!important;
  background-repeat:no-repeat!important;
  background-position:center!important;
  background-size:contain!important;
}
.min-h-screen.bg-gradient-to-br.from-blue-900.via-blue-800.to-blue-700 .inline-flex.items-center.justify-center.w-16.h-16.bg-white\\/10.rounded-2xl.mb-4>svg.lucide-shield{display:none!important;}

.min-h-screen.bg-\\[\\#0B63FF\\] .inline-flex.items-center.justify-center.w-16.h-16.bg-white.rounded-2xl.mb-4{
  background-color:#fff!important;
  background-image:url('/logo-unt.png')!important;
  background-repeat:no-repeat!important;
  background-position:center!important;
  background-size:contain!important;
}
.min-h-screen.bg-\\[\\#0B63FF\\] .inline-flex.items-center.justify-center.w-16.h-16.bg-white.rounded-2xl.mb-4>svg.lucide-shield{display:none!important;}

.dashboard-topbar .hidden.h-10.w-10.items-center.justify-center.rounded-xl.bg-white.shadow-sm.sm\\:flex.overflow-hidden{
  background-image:url('/logo-unt.png')!important;
  background-repeat:no-repeat!important;
  background-position:center!important;
  background-size:contain!important;
}
.dashboard-topbar .hidden.h-10.w-10.items-center.justify-center.rounded-xl.bg-white.shadow-sm.sm\\:flex.overflow-hidden>svg.lucide-shield{display:none!important;}

.dashboard-topbar .hidden.h-10.w-10.items-center.justify-center.rounded-xl.bg-blue-700.shadow-sm.sm\\:flex{
  background-color:#fff!important;
  background-image:url('/logo-unt.png')!important;
  background-repeat:no-repeat!important;
  background-position:center!important;
  background-size:contain!important;
}
.dashboard-topbar .hidden.h-10.w-10.items-center.justify-center.rounded-xl.bg-blue-700.shadow-sm.sm\\:flex>svg.lucide-shield{display:none!important;}
</style></head>`,
      );
      res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-store' });
      res.end(injected);
      return;
    } catch {
      send(res, 500, 'Internal Server Error');
      return;
    }
  }

  const stream = fs.createReadStream(filePath);
  stream.on('error', () => send(res, 404, 'Not Found'));
  res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-store' });
  stream.pipe(res);
}

function safeJoin(root, unsafePath) {
  const normalized = path.normalize(unsafePath).replace(/^([/\\])+/, '');
  const resolved = path.join(root, normalized);
  if (!resolved.startsWith(root)) return null;
  return resolved;
}

function appHtmlPathFromRoute(routePathname) {
  const clean = routePathname.replace(/\/+$/, '') || '/';
  if (clean === '/') return path.join(appRoot, 'login.html');

  const candidate = safeJoin(appRoot, `${clean}.html`);
  if (candidate && exists(candidate)) return candidate;

  const indexCandidate = safeJoin(appRoot, path.join(clean, 'index.html'));
  if (indexCandidate && exists(indexCandidate)) return indexCandidate;

  const notFound = path.join(appRoot, '_not-found.html');
  if (exists(notFound)) return notFound;

  return null;
}

const server = http.createServer((req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = url.pathname || '/';

    if (pathname === '/logo-unt.png') {
      const filePath = path.join(publicRoot, 'logo-unt.png');
      if (!exists(filePath)) return send(res, 404, 'Not Found');
      return sendFile(res, filePath);
    }

    if (pathname === '/auditorias' || pathname === '/auditorias/') {
      res.writeHead(302, { Location: '/auditorias/nueva' });
      res.end();
      return;
    }

    if (pathname === '/') {
      res.writeHead(302, { Location: '/login' });
      res.end();
      return;
    }

    if (pathname.startsWith('/_next/static/')) {
      const rel = pathname.replace('/_next/static/', '');
      const filePath = safeJoin(staticRoot, rel);
      if (!filePath || !exists(filePath)) return send(res, 404, 'Not Found');
      return sendFile(res, filePath);
    }

    const htmlPath = appHtmlPathFromRoute(pathname);
    if (htmlPath && exists(htmlPath)) return sendFile(res, htmlPath);

    return send(res, 404, 'Not Found');
  } catch {
    return send(res, 500, 'Internal Server Error');
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`SIGC-UNT Frontend (static) en: http://localhost:${port}/login`);
});
