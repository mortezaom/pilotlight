// Worker entry: Astro serves the site, the cron triggers run monitoring.
import { handle } from "@astrojs/cloudflare/handler";
import { CLEANUP_CRON, cleanupOldData, runMonitoring } from "./lib/monitoring";

export default {
  fetch: handle,
  scheduled(controller, _env, ctx) {
    ctx.waitUntil(
      controller.cron === CLEANUP_CRON ? cleanupOldData() : runMonitoring()
    );
  },
} satisfies ExportedHandler<Env>;
