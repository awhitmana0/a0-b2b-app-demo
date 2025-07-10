import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react()
  ],
  server: {
    port: 3002, // Your frontend dev server port
    host: true, // Allow external access (useful for mobile testing on local network)
    proxy: {
      // Proxy all requests starting with /api to your backend server
      '/api': {
        target: 'http://localhost:3001', // Your backend's local address
        changeOrigin: true, // Needed for virtual hosted sites (often good practice)
        // IMPORTANT: REMOVE THE REWRITE RULE.
        // The backend expects the /api prefix because of app.use('/api', apiRouter);
        // If you rewrite it here, the backend won't find the route.
      },
    }
  }
})
