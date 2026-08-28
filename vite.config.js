import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  publicDir: false,
  plugins: [{
    name: 'copy-pages-assets',
    generateBundle() {
      for (const file of ['robots.txt', 'sitemap.xml', '_headers']) {
        const source = resolve(root, file);
        if (existsSync(source)) {
          this.emitFile({ type: 'asset', fileName: file, source: readFileSync(source) });
        }
      }
    }
  }]
});