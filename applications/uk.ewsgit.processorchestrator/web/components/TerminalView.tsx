import { FitAddon, init, Terminal } from "ghostty-web";
import { type Component, createSignal, onCleanup, onMount } from "solid-js";
import type { TerminalClientMessage, TerminalServerMessage } from "../../backend/lib/terminalSocket";
import { APPLICATION_ID } from "../lib/trpc";
import styles from "./TerminalView.module.scss";

export interface TerminalControls {
  send(data: string): void;
  clear(): void;
  copy(): string;
  focus(): void;
}

export type Connection = "connecting" | "connected" | "disconnected";

const RECONNECT_MS = 2000;

/** a colour of the interface as the terminal wants it, the variables hold the channels of an rgb() colour */
const colour = (style: CSSStyleDeclaration, name: string, fallback: string) => {
  const value = style.getPropertyValue(name).trim();

  return value ? `rgb(${value})` : fallback;
};

const TerminalView: Component<{
  processId: string;
  onConnection?: (state: Connection) => void;
  onState?: (status: Extract<TerminalServerMessage, { t: "state" }>["status"]) => void;
  controls?: (controls: TerminalControls) => void;
}> = (props) => {
  let host!: HTMLDivElement;
  let terminal: Terminal | undefined;
  let socket: WebSocket | undefined;
  let reconnect: ReturnType<typeof setTimeout> | undefined;
  let disposed = false;
  const [ready, setReady] = createSignal(false);

  const send = (message: TerminalClientMessage) => {
    if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
  };

  const connect = () => {
    props.onConnection?.("connecting");

    const scheme = window.location.protocol === "https:" ? "wss" : "ws";

    socket = new WebSocket(`${scheme}://${window.location.host}/api/app/${APPLICATION_ID}/ws/${props.processId}`);

    socket.onopen = () => {
      props.onConnection?.("connected");

      if (terminal) send({ t: "resize", cols: terminal.cols, rows: terminal.rows });
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data) as TerminalServerMessage;

      if (message.t === "replay") {
        // a reconnect sends the history again, so start from a clean screen rather than doubling it
        terminal?.reset();
        terminal?.write(message.d);
      } else if (message.t === "out") {
        terminal?.write(message.d);
      } else if (message.t === "state") {
        props.onState?.(message.status);
      }
    };

    socket.onclose = () => {
      props.onConnection?.("disconnected");

      if (!disposed) reconnect = setTimeout(connect, RECONNECT_MS);
    };
  };

  onMount(async () => {
    await init();

    if (disposed) return;

    const style = getComputedStyle(host);

    terminal = new Terminal({
      fontSize: 14,
      fontFamily: 'ui-monospace, "JetBrains Mono", Menlo, Consolas, monospace',
      cursorBlink: true,
      scrollback: 10000,
      theme: {
        background: colour(style, "--uk-sys-color-surface-container-lowest", "#0f0f0f"),
        foreground: colour(style, "--uk-sys-color-on-surface", "#e6e6e6"),
        cursor: colour(style, "--uk-sys-color-primary", "#ffffff"),
        selectionBackground: colour(style, "--uk-sys-color-secondary-container", "#444444"),
        selectionForeground: colour(style, "--uk-sys-color-on-secondary-container", "#ffffff"),
      },
    });

    const fit = new FitAddon();

    terminal.loadAddon(fit);
    terminal.open(host);
    fit.fit();
    fit.observeResize();

    terminal.onData((data) => send({ t: "in", d: data }));
    terminal.onResize(({ cols, rows }) => send({ t: "resize", cols, rows }));

    props.controls?.({
      send: (data) => send({ t: "in", d: data }),
      clear: () => terminal?.clear(),
      copy: () => terminal?.getSelection() ?? "",
      focus: () => terminal?.focus(),
    });

    setReady(true);
    connect();
  });

  onCleanup(() => {
    disposed = true;
    clearTimeout(reconnect);
    socket?.close();
    terminal?.dispose();
  });

  return <div class={styles.root} ref={host} role="application" aria-label="Process terminal" data-ready={ready()} />;
};

export default TerminalView;
