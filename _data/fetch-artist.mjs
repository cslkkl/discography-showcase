/*  fetch-artist.mjs — 把一位歌手的目录事实抓成 albums-raw.json，并下载封面。
 *
 *  两种模式：
 *    node fetch-artist.mjs --list   --itunes-id <歌手id> [--country tw]
 *        列出该歌手在目录里的专辑（collectionId / 名称 / 年份 / 曲目数），供人工挑选
 *    node fetch-artist.mjs --fetch  --itunes-id <id> --artist <id> \
 *         --keys "<collectionId=albumKey, ...>" [--country tw]
 *        只抓 --keys 里列出的专辑，写成 _data/artists/<artist>/albums-raw.json，
 *        并把 1200px 封面下载到 assets/covers/<albumKey>.jpg
 *
 *  专辑键（albumKey）的约定：歌手前缀 + 年份，全局唯一；同年撞车加 a/b 后缀。
 *  事实与文案分离：本脚本只抓事实，介绍与年代分期写在 meta.mjs 里。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

const argv = process.argv.slice(2);
const opt = (name) => {
  const i = argv.indexOf('--' + name);
  return i >= 0 ? argv[i + 1] : undefined;
};
const mode = argv.includes('--list') ? 'list' : argv.includes('--fetch') ? 'fetch' : null;
const itunesId = opt('itunes-id');
const country = opt('country') || 'tw';
const artist = opt('artist');
const keysArg = opt('keys') || '';

if (!mode || !itunesId) {
  console.error('usage: node fetch-artist.mjs --list|--fetch --itunes-id <id> [--country tw]');
  console.error('       fetch 模式另需 --artist <id> --keys "<collectionId=key, ...>"');
  process.exit(2);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function itunes(pathname, params) {
  const url = `https://itunes.apple.com/${pathname}?${new URLSearchParams(params)}`;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'discography-showcase/1.0' } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } catch (e) {
      if (attempt === 5) throw e;
      await sleep(600 * attempt);
    }
  }
}

const expand = (art) => (art || '').replace(/\/\d+x\d+bb\./, '/1200x1200bb.');

if (mode === 'list') {
  const data = await itunes('lookup', { id: itunesId, entity: 'album', limit: 200, country });
  const name = data.results.find((r) => r.wrapperType === 'artist');
  console.log(`artist: ${name ? name.artistName : '?'} (${itunesId})`);
  const albums = data.results
    .filter((r) => r.wrapperType === 'collection' && r.collectionType === 'Album')
    .sort((a, b) => (a.releaseDate || '').localeCompare(b.releaseDate || ''));
  for (const a of albums) {
    console.log(
      `${a.collectionId}\t${(a.releaseDate || '').slice(0, 10)}\t${a.trackCount}首\t${a.collectionName}`
    );
  }
  console.log(`total: ${albums.length}`);
} else {
  if (!artist || !keysArg) {
    console.error('fetch 模式需要 --artist 与 --keys');
    process.exit(2);
  }
  const wanted = keysArg
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((pair) => {
      const i = pair.indexOf('=');
      return { collectionId: Number(pair.slice(0, i)), key: pair.slice(i + 1) };
    });
  const seen = new Set();
  for (const w of wanted) {
    if (seen.has(w.key)) throw new Error(`albumKey 重复: ${w.key}`);
    seen.add(w.key);
  }

  const out = [];
  const coversDir = path.join(root, 'assets', 'covers');
  fs.mkdirSync(coversDir, { recursive: true });

  for (const w of wanted) {
    const data = await itunes('lookup', {
      id: w.collectionId,
      entity: 'song',
      limit: 200,
      country
    });
    const col = data.results.find((r) => r.wrapperType === 'collection');
    if (!col) throw new Error(`collection ${w.collectionId} not found`);
    const tracks = data.results
      .filter((r) => r.wrapperType === 'track')
      .sort((a, b) => a.discNumber - b.discNumber || a.trackNumber - b.trackNumber)
      .map((t) => ({
        n: t.trackNumber,
        disc: t.discNumber || 1,
        name: t.trackName,
        time: t.trackTimeMillis || 0,
        p: t.previewUrl || null
      }));
    if (!tracks.length) throw new Error(`collection ${w.collectionId} has no tracks`);
    const missing = tracks.filter((t) => !t.p).length;
    const album = {
      key: w.key,
      collectionId: w.collectionId,
      collectionName: col.collectionName,
      artistName: col.artistName,
      releaseDate: col.releaseDate,
      trackCount: tracks.length,
      copyright: col.copyright || '',
      artwork: expand(col.artworkUrl100),
      tracks
    };
    out.push(album);

    const coverPath = path.join(coversDir, w.key + '.jpg');
    const img = await fetch(album.artwork);
    if (!img.ok) throw new Error(`cover fetch failed for ${w.key}: HTTP ${img.status}`);
    fs.writeFileSync(coverPath, Buffer.from(await img.arrayBuffer()));
    console.log(
      `${w.key.padEnd(14)} ${album.releaseDate.slice(0, 10)}  ${String(tracks.length).padStart(2)}首` +
        `  试听${tracks.length - missing}/${tracks.length}  封面已下载`
    );
    await sleep(350);
  }

  const dir = path.join(root, '_data', 'artists', artist);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'albums-raw.json'), JSON.stringify(out, null, 2) + '\n', 'utf8');
  console.log(`\nalbums-raw.json written: ${out.length} albums -> _data/artists/${artist}/`);
  console.log('下一步：extract-colors.ps1 -Artist ' + artist + '，然后手写 meta.mjs');
}
