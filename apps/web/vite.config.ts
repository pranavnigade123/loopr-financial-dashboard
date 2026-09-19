import { defineConfig } from 'vite';
import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(() => {
  const envFile = fileURLToPath(new URL('../../.env', import.meta.url));
  // Used only by Vite's server; database and JWT settings never enter the browser bundle.
  const environment = existsSync(envFile) ? parseEnv(readFileSync(envFile, 'utf8')) : {};
  const apiPort = process.env.PORT ?? environment.PORT ?? '3000';
  return {
    plugins: [react(), tailwindcss()],
    server: { port: 5173, strictPort: true, proxy: { '/api': `http://127.0.0.1:${apiPort}` } },
  };
});
