import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
  // logos are data URIs, so no Cloudflare Images binding is needed
  adapter: cloudflare({ imageService: "passthrough" }),
  integrations: [react()],
  output: "server",
  // no sessions: everything lives in D1, so no KV binding is needed
  session: false,
  vite: { plugins: [tailwindcss()] },
});
