import { defineConfig } from "vite";

// GitHub Pages serves the site at /<repo-name>/, so assets need that base path.
export default defineConfig({
  base: "/hostile-take/",
});
