import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
  manifest_version: 3,
  name: "Quick Search",
  version: "1.0.0",
  background: { service_worker: "src/content/background.ts", type: "module" },
  host_permissions: ["http://localhost:8000/*"],
  content_scripts: [
    {
      matches: ["<all_urls>"],
      js: ["src/content/main.tsx"],
      css: ["src/content/content.css"],
    },
  ],
});
