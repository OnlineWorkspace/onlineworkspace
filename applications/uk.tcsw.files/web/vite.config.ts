// INFO: this file is purely for webstorm to infer the application's web as being a solid application

import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

export default defineConfig({
    plugins: [
        solid(),
    ],
    server: {
        host: true,
    },
});
