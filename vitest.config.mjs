import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.js'],
    maxWorkers: 4,                                       // jeder Worker lädt das ganze Spiel in jsdom (~1 GB) – mehr legte den Mac (16 GB) lahm, wenn mehrere Läufe gleichzeitig liefen
    minWorkers: 1,
    exclude: ['**/node_modules/**', 'bench-base/**'],   // Kopie des alten Stands zum Bildvergleich (Block 124)
  },
});
