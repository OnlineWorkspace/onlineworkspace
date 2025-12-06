import { onCleanup, onMount, type Component } from "solid-js";
import styles from "./index.module.scss";
import { init, Terminal } from "ghostty-web";
import trpc from "../../lib/trpc";
import type { Unsubscribable } from "@trpc/server/observable";

const RootPage: Component = () => {
    let termRoot!: HTMLDivElement;
    let term!: Terminal;
    let subscription: Unsubscribable;

    onMount(async () => {
        await init();

        term = new Terminal({
            fontSize: 14,
            theme: {
                background: "#1a1b26",
                foreground: "#a9b1d6",
            },
            cursorBlink: true,
            cols: 120,
        });

        term.open(termRoot);

        term.onData(() => 0);

        subscription = trpc.output.subscribe(undefined, {
            onData: (opt) => {
                term.write(opt.join(" ") + "\n\r");
            },
        });
    });

    onCleanup(() => {
        subscription.unsubscribe();
    });

    return <div class={styles.root} ref={termRoot} />;
};

export default RootPage;
