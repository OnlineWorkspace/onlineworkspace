// import devtools from "solid-devtools/vite";
import { defineConfig } from "vite";
import { compression } from "vite-plugin-compression2";
import solid from "vite-plugin-solid";

export default defineConfig({
  plugins: [
    // @ts-ignore
    // devtools({
    //     /* features options - all disabled by default */
    //     autoname: true, // e.g. enable autoname
    // }),
    solid(),
    compression(),
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
  resolve: {
    alias: {
      "@solidjs/router": "/node_modules/@solidjs/router",
      "@ewsgit/uikit-solid": "/node_modules/@ewsgit/uikit-solid",
      "@onlineworkspace/workspaces-applications": "/../../../fs/system/vite/Applications.tsx",
    },
  },
});
