// Benchmarks (`npm run bench`): timings of pure game logic in Node, without the DOM test setup.
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    benchmark: { include: ['src/**/*.bench.ts'] },
  },
})
