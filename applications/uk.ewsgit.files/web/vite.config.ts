import {defineConfig} from "vite";
import solid from "vite-plugin-solid";

export default defineConfig({
  plugins: [
    solid(),
  ],
  server: {
    host: true,
    allowedHosts: [ process.env.ALLOW_HOST || "localhost" ],
    hmr: {
      clientPort: 443,
      protocol: "wss",
      host: process.env.ALLOW_HOST || "localhost",
    },
  },
  resolve: {
    alias: {
      "@solidjs/router": "/../../../node_modules/@solidjs/router",
      "@ewsgit/uikit-solid": "/../../../node_modules/@ewsgit/uikit-solid",
      "@onlineworkspace/workspaces-applications": "/../../../fs/Applications.tsx",
    },
  },
});
