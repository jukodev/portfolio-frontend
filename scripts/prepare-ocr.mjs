import { copyFile, mkdir, readdir, unlink } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const output = new URL('public/ocr/', root);
await mkdir(output, { recursive: true });
// These generated runtime files come from the pinned npm dependencies.
for (const file of await readdir(output)) {
  if (/^(tesseract-core.*\.(js|wasm)|worker\.min\.js)$/.test(file)) await unlink(new URL(file, output));
}
await copyFile(new URL('node_modules/tesseract.js/dist/worker.min.js', root), new URL('worker.min.js', output));
for (const file of ['tesseract-core-lstm.wasm.js', 'tesseract-core-simd-lstm.wasm.js', 'tesseract-core-relaxedsimd-lstm.wasm.js']) {
  await copyFile(new URL(`node_modules/tesseract.js-core/${file}`, root), new URL(file, output));
}
