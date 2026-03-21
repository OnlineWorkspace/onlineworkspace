// import devtools from "solid-devtools/vite";
import { defineConfig } from "vite";
import {compression} from "vite-plugin-compression2";
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
  },
  resolve: {
    alias: {
      "@solidjs/router": "/../../../node_modules/@solidjs/router",
      "@tcsw/uikit-solid": "/../../../uikit-solid",
      "@tcsw/workspaces-applications": "/../../../fs/Applications.tsx"
    },
  },
});
