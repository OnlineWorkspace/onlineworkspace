// import devtools from "solid-devtools/vite";
import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

export default defineConfig({
  plugins: [
    // @ts-ignore
    // devtools({
    //     /* features options - all disabled by default */
    //     autoname: true, // e.g. enable autoname
    // }),
    solid(),
  ],
  server: {
    host: true,
    allowedHosts: [process.env.ALLOW_HOST || "localhost"],
    hmr: {
      clientPort: 443,
      protocol: "wss",
      host: process.env.ALLOW_HOST || "localhost",
    },
  },
  optimizeDeps: {
    exclude: ["fs-events"],
  },
  resolve: {
    // applications keep their own node_modules, and a build bundles every copy of these it finds, while the dev server
    // pre-bundles one. Two copies of solid-js do not share a reactive root, so routes of applications would never match.
    dedupe: ["solid-js", "solid-js/web", "solid-js/store", "@solidjs/router"],
    alias: {
      "@solidjs/router": "/../node_modules/@solidjs/router",
      "@ewsgit/uikit-solid": "/../node_modules/@ewsgit/uikit-solid",
      "@onlineworkspace/workspaces-applications": "/../fs/system/vite/Applications.tsx",
    },
  },
});
