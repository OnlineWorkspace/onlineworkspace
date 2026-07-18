// import devtools from "solid-devtools/vite";
import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

export default defineConfig({
  plugins: [
    solid(),
  ],
  server: {
    host: "127.0.0.1",
    port: 5175,
  },
  optimizeDeps: {
    exclude: ["fs-events"],
  },
  root: ".",
  resolve: {
    alias: {
      "@solidjs/router": "/../../../node_modules/@solidjs/router",
      "@ewsgit/uikit-solid": "/../../../node_modules/@ewsgit/uikit-solid",
    },
  },
});
