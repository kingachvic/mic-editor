// node make-scenes.mjs <folder> [voice_timings.json]  ->  src/scenes.js (the .mic files and timings, as a module)
import {existsSync, readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
const [dir = 'scenes', tPath] = process.argv.slice(2);
const files = readdirSync(dir).filter(f => f.endsWith('.mic') && f !== 'library.mic').map(name => ({name, src: readFileSync(join(dir, name), 'utf8')}));
const library = existsSync(join(dir, 'library.mic')) ? readFileSync(join(dir, 'library.mic'), 'utf8') : undefined;
const timings = tPath && existsSync(tPath) ? JSON.parse(readFileSync(tPath, 'utf8')) : null;
writeFileSync('src/scenes.js', `export default ${JSON.stringify({files, timings, library})};\n`);
console.log(`src/scenes.js: ${files.length} scene file(s)${library ? ' + library.mic' : ''}${timings ? ', with voice timings' : ', estimated timing'}`);
