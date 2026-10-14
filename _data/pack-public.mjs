/* 產出可公開部署的 dist/：只含站點執行期需要的檔案（封面、字型、CSS、JS、data.js），
   不含 assets/audio（自有音檔，數十 GB）與歌詞 sidecar。

   為什麼要有這一步：把倉庫根目錄直接丟上主機，會連 .git、_data、docs、node_modules、
   五十多 GB 的音檔一起暴露出去。這個腳本把「對外要用的東西」挑出來，
   並且在打包後**驗證兩件事**，避免上線才發現問題：
     1. 引用完整：HTML／CSS／data.js 裡引用的每個本地資源，dist 裡都存在
     2. 不外洩：js/data.js 不含本機音檔路徑、local 旗標或歌詞欄位
   任一項不通過就以非零退出，不會產出一個半殘的包。 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const dist = path.join(root, 'dist');

/* 先跑一次公開建置：公開產物必須逐位元組不含本機路徑，不能靠「上一次剛好是公開態」 */
console.log('· 公開建置');
execFileSync(process.execPath, [path.join(here, 'build.mjs')], { cwd: root, stdio: 'inherit' });

if (fs.rmSync) fs.rmSync(dist, { recursive: true, force: true });

const FILES = ['index.html', 'artist.html', 'LICENSE'];

let copied = 0;
let bytes = 0;
function copyFile(rel) {
  const src = path.join(root, rel);
  if (!fs.existsSync(src)) {
    console.error(`  x 缺少來源檔 ${rel}`);
    process.exitCode = 1;
    return;
  }
  const dest = path.join(dist, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  copied++;
  bytes += fs.statSync(dest).size;
}

for (const f of FILES) copyFile(f);
/* 遞迴複製：assets/covers/responsive/ 放的是各尺寸封面（app.js 的 srcset 在用），
   只抄一層會漏掉 162 個檔。 */
function copyDir(rel, keep) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) return;
  for (const name of fs.readdirSync(abs)) {
    const childRel = rel + '/' + name;
    if (fs.statSync(path.join(abs, name)).isDirectory()) {
      copyDir(childRel, keep);
      continue;
    }
    if (keep && !keep(name)) continue;
    copyFile(childRel);
  }
}
copyDir('js', (n) => n.endsWith('.js'));
copyDir('css', (n) => n.endsWith('.css'));
copyDir('assets/fonts');
copyDir('assets/covers');
/* assets/ 根層的零散資源（favicon 等） */
for (const name of fs.readdirSync(path.join(root, 'assets'))) {
  if (fs.statSync(path.join(root, 'assets', name)).isFile()) copyFile('assets/' + name);
}

console.log(`· 已複製 ${copied} 個檔（${(bytes / 1048576).toFixed(1)} MB）`);

/* ---------- 驗證 1：引用完整 ----------
   解析基準各不相同，弄錯就會得到一堆假缺失：
   - HTML 的 src/href   → 相對「頁面」
   - CSS 的 url()       → 相對「該 CSS 檔」
   - JS 裡的 'assets/…' → 腳本在頁面裡執行，相對「頁面」
   另外要跳過 data: URI 與 SVG 濾鏡的 url(%23n)（%23 是編碼過的 #）。 */
const refs = new Map();
function addRef(fromFile, target, base) {
  if (!target) return;
  const t = target.trim();
  if (!t || /^(https?:|data:|mailto:|blob:|#|%23|\/\/)/i.test(t)) return;
  const key = t.split('?')[0].split('#')[0];
  if (!key || key.endsWith('/')) return;
  const abs = path.resolve(base, key);
  if (!refs.has(abs)) refs.set(abs, { target: key, from: fromFile });
}
function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) {
      walk(p);
      continue;
    }
    const ext = path.extname(p).toLowerCase();
    const text = fs.readFileSync(p, 'utf8');
    const from = path.relative(dist, p);
    if (ext === '.html') {
      for (const m of text.matchAll(/(?:src|href)="([^"]+)"/g)) addRef(from, m[1], dist);
    } else if (ext === '.css') {
      for (const m of text.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g))
        addRef(from, m[2], path.dirname(p));
    } else if (ext === '.js') {
      for (const m of text.matchAll(/["'](assets\/[^"']+)["']/g)) addRef(from, m[1], dist);
    }
  }
}
walk(dist);
const broken = [];
for (const [abs, info] of refs)
  if (!fs.existsSync(abs)) broken.push(`${info.from} → ${info.target}`);
console.log(`· 引用檢查：${refs.size} 個本地引用，缺失 ${broken.length}`);
broken.slice(0, 20).forEach((b) => console.error('  x ' + b));
if (broken.length) process.exitCode = 1;

/* ---------- 驗證 2：不外洩本機資訊 ----------
   公開產物可以帶 `local:false`（前端要知道，且全為 false、不含路徑），
   但絕不能出現本機音檔路徑、歌詞、local:true 或任何絕對路徑。 */
const dataJs = fs.readFileSync(path.join(dist, 'js', 'data.js'), 'utf8');
const leaks = [];
if (/assets\/audio\//.test(dataJs)) leaks.push('出現 assets/audio/ 路徑');
if (/"local"\s*:\s*true/.test(dataJs)) leaks.push('出現 local:true');
if (/"lyrics"\s*:/.test(dataJs)) leaks.push('出現 lyrics 欄位');
if (/["'][A-Za-z]:[\\/]/.test(dataJs)) leaks.push('出現 Windows 絕對路徑');
if (/file:\/\//i.test(dataJs)) leaks.push('出現 file:// 路徑');
console.log(`· 外洩檢查：${leaks.length ? leaks.join('、') : '乾淨'}`);
if (leaks.length) process.exitCode = 1;

if (process.exitCode) {
  console.error('\n發布包未通過驗證，已中止。');
} else {
  console.log(`\n完成：${path.relative(root, dist)}（${(bytes / 1048576).toFixed(1)} MB）`);
  console.log('  這個目錄可以直接上傳到任何靜態主機，或設成 GitHub Pages 的來源。');
}
