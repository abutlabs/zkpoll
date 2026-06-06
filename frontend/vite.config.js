import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// klopthet front-end. Standalone (no backend) so it deploys to GitHub Pages as a static site.
// base "/" because it's served from the apex custom domain klopthet.nl (see public/CNAME).
export default defineConfig({
  plugins: [react()],
  base: "/",
});
