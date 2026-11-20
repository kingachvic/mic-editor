// node render.mjs [id ...]  ->  out/<id>.mp4 for every id in ids.txt (or the ones named); COPY_TO=dir copies each one there
import {spawnSync} from 'node:child_process';
import {copyFileSync, existsSync, mkdirSync, readFileSync} from 'node:fs';
import {cpus} from 'node:os';
const ids = process.argv.slice(2).length ? process.argv.slice(2) : readFileSync('ids.txt', 'utf8').split('\n').filter(Boolean);
const conc = Number(process.env.CONCURRENCY || cpus().length);
mkdirSync('out', {recursive: true});
const failed = [];
const t00 = Date.now();
for (const [i, id] of ids.entries()) {
  const t0 = Date.now();
  const r = spawnSync('npx', ['remotion', 'render', id, `out/${id}.mp4`, `--concurrency=${conc}`, '--log=error'], {stdio: 'inherit'});
  if (r.status !== 0 || !existsSync(`out/${id}.mp4`)) { failed.push(id); console.log(`FAILED ${id}`); continue; }
  console.log(`[${i + 1}/${ids.length}] ${id} done in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  if (process.env.COPY_TO) { mkdirSync(process.env.COPY_TO, {recursive: true}); copyFileSync(`out/${id}.mp4`, `${process.env.COPY_TO}/${id}.mp4`); }
}
console.log(failed.length ? `\nFAILED: ${failed.join(', ')}. Send Claude the messages above.` : `\nall ${ids.length} done in ${((Date.now() - t00) / 60000).toFixed(1)} min`);
process.exit(failed.length ? 1 : 0);
