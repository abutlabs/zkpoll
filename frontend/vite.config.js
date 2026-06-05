import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// The frontend is fully independent; it talks to the backend over HTTP.
// In dev we proxy /api -> the backend so there are no CORS surprises.
// The zkPassport SDK expects Node globals (Buffer/process/global) in the browser.
export default defineConfig({
  plugins: [react(), nodePolyfills({ globals: { Buffer: true, global: true, process: true } })],
  server: {
    port: 5173,
    proxy: { "/api": "http://localhost:8787" },
  },
});
