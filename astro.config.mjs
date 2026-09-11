import { defineConfig } from "astro/config";

const SITE_URL = 'https://motiuorg.github.io';

export default defineConfig({
  site: SITE_URL,
  base: '/Salentu-Rigenerativu',
  output: "static",
  outDir: "./dist",
  build: { format: "directory" },
});