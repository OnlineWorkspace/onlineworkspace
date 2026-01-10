import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
// import devtools from "solid-devtools/vite";

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
    },
    resolve: {
        alias: {
            "@solidjs/router": "/../../../node_modules/@solidjs/router",
            "@tcsw/uikit-solid": "/../../../uikit-solid",
        },
    },
});
