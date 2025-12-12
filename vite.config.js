import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  // Robustly find the API Key from various possible environment variable names
  // This supports both Vercel's standard env vars and VITE_ prefixed vars
  const apiKey = env.API_KEY || env.VITE_API_KEY || process.env.API_KEY || process.env.VITE_API_KEY || "";
  
  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
      rollupOptions: {
        // Critical for using the CDN import map in production
        external: ['@google/genai']
      }
    },
    define: {
      // Inject the API Key globally
      'process.env.API_KEY': JSON.stringify(apiKey)
    }
  }
})