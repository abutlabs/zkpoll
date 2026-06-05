import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The frontend is fully independent; it talks to the backend over HTTP.
// In dev we proxy /api -> the backend so there are no CORS surprises.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { "/api": "http://localhost:8787" },
  },
});
