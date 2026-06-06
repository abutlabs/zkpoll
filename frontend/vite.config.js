import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// klopthet front-end. Standalone (no backend) so it deploys to GitHub Pages as a static site.
// Relative base ("./") makes the SAME build work both at the project URL
// (abutlabs.github.io/zkpoll/) now AND at the apex domain klopthet.nl later — no rebuild needed.
// (The app routes via state, not URL paths, so relative asset paths are safe.)
export default defineConfig({
  plugins: [react()],
  base: "./",
});
