/*  check-ps1-ascii.mjs — 保證 PowerShell 腳本裡沒有非 ASCII 位元組。
 *
 *  為什麼需要這道檢查：本機 ACP 是 936（GBK），而 Windows PowerShell 5.1
 *  會把「無 BOM 的 UTF-8 .ps1」當 GBK 解碼。此時中文註解行尾的字元（例如句號）
 *  會被解成「GBK 雙位元組 + 落單位元組」，解碼器連後面的 LF 一起吃掉，
 *  於是**下一行代碼被併進註解**。
 *
 *  這不是理論風險：fetch-previews.ps1 曾因此把 `$json = ...` 註解掉，
 *  導致 `WriteAllText(path, "", ...)` 把 albums-raw.json 寫成 0 位元組，
 *  而且 exit code 是 0、沒有任何報錯。抓取腳本靜默清空事實層資料。
 *
 *  為什麼是「禁非 ASCII」而不是「加 BOM」：本倉的 check-line-endings.py 與
 *  .gitattributes 要求 LF 且不允許 BOM，所以 BOM 不是選項；腳本本身保持
 *  純 ASCII 就與解碼器無關，用 powershell 或 pwsh 執行都一樣。
 *
 *  用法：node _data/check-ps1-ascii.mjs
 *  退出碼：0 = 全部純 ASCII，1 = 有檔案含非 ASCII。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const SKIP = new Set(['node_modules', '.git', 'dist', 'build']);
const NON_ASCII = (ch) => ch.codePointAt(0) > 0x7f;

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (!SKIP.has(e.name)) walk(path.join(dir, e.name), out);
    } else if (e.name.toLowerCase().endsWith('.ps1')) {
      out.push(path.join(dir, e.name));
    }
  }
  return out;
}

const files = walk(root).sort();
const bad = [];
for (const f of files) {
  const bytes = fs.readFileSync(f);
  let count = 0;
  for (const b of bytes) if (b > 0x7f) count++;
  if (!count) continue;

  const lines = bytes.toString('utf8').split('\n');
  const where = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if ([...line].some(NON_ASCII)) {
      where.push({ n: i + 1, text: line.trim().slice(0, 72) });
    }
  }
  bad.push({ file: path.relative(root, f).replace(/\\/g, '/'), count, where });
}

if (!bad.length) {
  console.log(`checked ${files.length} .ps1 files, all pure ASCII`);
  process.exit(0);
}

console.error(
  `FAIL: ${bad.length} 個 .ps1 含非 ASCII（Windows PowerShell 5.1 會誤解碼，可能吞掉下一行代碼）`
);
for (const b of bad) {
  console.error(`  ${b.file}：${b.count} 個非 ASCII 位元組`);
  for (const w of b.where.slice(0, 6)) {
    console.error(`    第 ${w.n} 行: ${w.text}`);
  }
  if (b.where.length > 6) console.error(`    …另有 ${b.where.length - 6} 行`);
}
console.error(
  '\n修法：把註解與字串改成純 ASCII（本倉要求 LF 且不得用 BOM，所以加 BOM 不是選項）。'
);
process.exit(1);
