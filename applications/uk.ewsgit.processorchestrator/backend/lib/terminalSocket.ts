import type { WebSocketHandler } from "bun";
import { db, type ProcessRow } from "./db.ts";
import type Supervisor from "./supervisor.ts";
import type { RuntimeStatus } from "./supervisor.ts";

export const TERMINAL_KIND = "uk.ewsgit.processorchestrator.terminal";

export interface TerminalSocketData {
  kind: typeof TERMINAL_KIND;
  userId: number;
  processId: string;
  unsubscribe?: () => void;
}

export type TerminalServerMessage = { t: "replay"; d: string } | { t: "out"; d: string } | { t: "state"; status: RuntimeStatus };
export type TerminalClientMessage = { t: "in"; d: string } | { t: "resize"; cols: number; rows: number };

const decoder = () => new TextDecoder("utf-8");

export function createTerminalHandler(supervisor: Supervisor): WebSocketHandler<TerminalSocketData> {
  return {
    async open(socket) {
      const [row] = (await db`SELECT * FROM public.uk_ewsgit_processorchestrator_processes WHERE id = ${socket.data.processId}`) as ProcessRow[];

      if (!row) {
        socket.close(4404, "Unknown process");
        return;
      }

      // a stream decoder per socket keeps characters which are split between chunks whole
      const stream = decoder();
      const send = (message: TerminalServerMessage) => socket.send(JSON.stringify(message));

      send({ t: "replay", d: new TextDecoder().decode(supervisor.replay(row.id)) });
      send({ t: "state", status: supervisor.status(row.id) });

      socket.data.unsubscribe = supervisor.subscribe(row, {
        output: (data) => send({ t: "out", d: stream.decode(data, { stream: true }) }),
        state: (status) => send({ t: "state", status }),
      });
    },
    message(socket, raw) {
      let message: TerminalClientMessage;

      try {
        message = JSON.parse(raw.toString());
      } catch {
        return;
      }

      if (message.t === "in" && typeof message.d === "string" && message.d.length <= 65536) {
        supervisor.write(socket.data.processId, message.d);
      } else if (message.t === "resize" && Number.isFinite(message.cols) && Number.isFinite(message.rows)) {
        supervisor.resize(socket.data.processId, Math.floor(message.cols), Math.floor(message.rows));
      }
    },
    close(socket) {
      socket.data.unsubscribe?.();
    },
  };
}
