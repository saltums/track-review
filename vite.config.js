import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const repoName = 'track-review'

export default defineConfig({
  plugins: [react()],
  base: `/${repoName}/`,
  build: {
    outDir: 'docs',
    emptyOutDir: true,
  },
  optimizeDeps: {
    include: ['lamejs'],
  },
})
