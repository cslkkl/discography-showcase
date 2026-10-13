/* Minimal dependency-free static server for local preview and verification. */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.argv[2] || 8099);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.flac': 'audio/flac',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.ogg': 'audio/ogg',
  '.oga': 'audio/ogg',
  '.opus': 'audio/ogg',
  '.wav': 'audio/wav'
};

/* 本機音檔單曲可達 200 MB（母帶級 FLAC），必須支援 Range 與串流：
   沒有 accept-ranges 時瀏覽器把音源視為不可尋址，進度條拖不動，
   而整檔 readFile 會把兩百多 MB 一次讀進記憶體。 */
function sendFile(req, res, file, showPath) {
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('404 ' + showPath);
      return;
    }
    let start = 0;
    let end = st.size - 1;
    let code = 200;
    const range = req.headers.range;
    if (range) {
      const m = /^bytes=(\d*)-(\d*)$/.exec(String(range).trim());
      if (m) {
        if (!m[1] && m[2]) start = Math.max(0, st.size - Number(m[2]));
        else {
          start = Number(m[1] || 0);
          if (m[2]) end = Math.min(Number(m[2]), st.size - 1);
        }
        if (start > end || start >= st.size) {
          res.writeHead(416, { 'content-range': 'bytes */' + st.size }).end();
          return;
        }
        code = 206;
      }
    }
    const headers = {
      'content-type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'cache-control': 'no-store',
      'access-control-allow-origin': '*',
      'accept-ranges': 'bytes',
      'content-length': String(end - start + 1)
    };
    if (code === 206) headers['content-range'] = 'bytes ' + start + '-' + end + '/' + st.size;
    res.writeHead(code, headers);
    if (req.method === 'HEAD') {
      res.end();
      return;
    }
    const stream = fs.createReadStream(file, { start, end });
    stream.on('error', () => res.destroy());
    stream.pipe(res);
  });
}

http
  .createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const file = path.join(root, path.normalize(p).replace(/^([\\/])+/, ''));
    if (!file.startsWith(root)) {
      res.writeHead(403).end('forbidden');
      return;
    }
    sendFile(req, res, file, p);
  })
  .listen(port, '127.0.0.1', () => console.log('serving ' + root + ' on http://127.0.0.1:' + port));
