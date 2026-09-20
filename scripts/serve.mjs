import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderIndex } from './template.mjs';
const projectRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const root = process.argv.includes('--dist') ? path.join(projectRoot, 'dist') : projectRoot;
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.webm': 'video/webm',
  '.mp4': 'video/mp4',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
};
export function createServer({ directory = root, base = '/portfolio/' } = {}) {
  return http.createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      const relative = pathname.startsWith(base) ? pathname.slice(base.length) : pathname.slice(1);
      const file = path.resolve(directory, relative || 'index.html');
      if (!file.startsWith(directory + path.sep)) return res.writeHead(403).end('Forbidden');
      // Local development exposes only the same public files as the release build.
      const publicPath = path.relative(directory, file).replaceAll('\\', '/');
      if (
        ![
          'index.html',
          'style.css',
          'main.js',
          'projects.js',
          'robots.txt',
          'sitemap.xml',
          '.nojekyll',
        ].includes(publicPath) &&
        !publicPath.startsWith('assets/')
      )
        return res.writeHead(404).end('Not found');
      const info = await stat(file);
      if (!info.isFile()) throw new Error('Not a file');
      let bytes = await readFile(file);
      if (path.basename(file) === 'index.html' && directory === projectRoot)
        bytes = Buffer.from(renderIndex(bytes.toString()));
      res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
      res.setHeader('Cache-Control', 'no-cache');
      if (req.headers.range) {
        const match = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range);
        if (!match) return res.writeHead(416).end();
        const start = Number(match[1]),
          end = match[2] ? Math.min(Number(match[2]), bytes.length - 1) : bytes.length - 1;
        if (start > end || start >= bytes.length)
          return res.writeHead(416, { 'Content-Range': `bytes */${bytes.length}` }).end();
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${bytes.length}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': end - start + 1,
        });
        res.end(req.method === 'HEAD' ? undefined : bytes.subarray(start, end + 1));
      } else {
        res.writeHead(200, { 'Content-Length': bytes.length, 'Accept-Ranges': 'bytes' });
        res.end(req.method === 'HEAD' ? undefined : bytes);
      }
    } catch {
      res.writeHead(404).end('Not found');
    }
  });
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 4190);
  createServer().listen(port, '127.0.0.1', () =>
    console.log(`Portfolio: http://127.0.0.1:${port}/portfolio/`),
  );
}
