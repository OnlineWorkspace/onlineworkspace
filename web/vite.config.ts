// import devtools from "solid-devtools/vite";
import { existsSync } from "node:fs";
import path from "node:path";
import { defineConfig, searchForWorkspaceRoot } from "vite";
import solid from "vite-plugin-solid";

// applications kept outside this workspace (artemis_admin in the mono repo, where this is a submodule) import their own images and
// data, and vite refuses to serve files outside its allow list. The mono checkout is allowed when this sits in one, and
// VITE_FS_ALLOW (a comma separated list of paths) adds anything else.
const monoRoot = path.resolve(import.meta.dirname, "../../..");
const extraAllowed = [
  ...(existsSync(path.join(monoRoot, "petra.json")) ? [monoRoot] : []),
  ...(process.env.VITE_FS_ALLOW?.split(",").filter(Boolean).map((entry) => path.resolve(entry)) ?? []),
];

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
    fs: { allow: [searchForWorkspaceRoot(process.cwd()), ...extraAllowed] },
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
