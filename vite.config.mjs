import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In dev, Vite serves the React app on :5173 and proxies /api/* to the local
// API server (server/dev-server.js on :3001). On Vercel, /api/* is served by
// the serverless functions in ./api, so no proxy is involved.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { "/api": "http://localhost:3001" },
  },
});
