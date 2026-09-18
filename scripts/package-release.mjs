import { cp, mkdir } from 'node:fs/promises';

// Copy an explicit allowlist so local secrets and assignment data never enter a release.
const root = new URL('../', import.meta.url);
const output = new URL('release/', root);
await mkdir(output, { recursive: true });
for (const path of [
  'apps/api/dist',
  'apps/web/dist',
  'packages/contracts/dist',
  'packages/contracts/package.json',
  'apps/api/package.json',
  'apps/web/package.json',
  'package.json',
  'package-lock.json',
]) {
  await cp(new URL(path, root), new URL(path, output), { recursive: true });
}
console.info('Compiled release assembled without source data or environment files.');
