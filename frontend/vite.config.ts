import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// `base: './'` keeps asset URLs relative so the build works from a domain
// root (Vercel, Netlify) and from a sub-path (GitHub Pages) without changes.
export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
