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
    allowedHosts: [process.env.ALLOW_HOST || "localhost", "localhost"],
  },
  resolve: {
    alias: {
      "@solidjs/router": "/node_modules/@solidjs/router",
      "@tcsw/uikit-solid": "/node_modules/@tcsw/uikit-solid",
      "@tcsw/workspaces-applications": "/../../../fs/Applications.tsx",
    },
  },
});
