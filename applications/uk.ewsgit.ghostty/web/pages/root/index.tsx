import { createEffect, type Component } from "solid-js";
import styles from "./index.module.scss";
import { init, Terminal } from "ghostty-web";

const RootPage: Component = () => {
    let termRoot!: HTMLDivElement;

    createEffect(async () => {
        await init();

        const term = new Terminal({
            fontSize: 14,
            theme: {
                background: "#1a1b26",
                foreground: "#a9b1d6",
            },
            cursorBlink: true,
        });

        term.open(termRoot);
        term.write("Ghostty terminal for Workspaces (Work In Progress)");

        let store = "";

        term.onData((data) => {
            store += data;
            term.write(data);
        });
    });

    return <div class={styles.root} ref={termRoot} />;
};

export default RootPage;
