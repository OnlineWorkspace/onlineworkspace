import type {
  NotificationClientMessage,
  NotificationServerMessage,
  WorkspacesNotificationAction,
  WorkspacesNotificationPayload,
} from "@onlineworkspace/workspace-backend/src/systems/notifications.ts";
import { createRoot, createSignal } from "solid-js";
import backend from "./backend";

export type ClientNotification = WorkspacesNotificationPayload;

const RECONNECT_DELAY_MS = 3000;

function websocketUrl(): string {
  return backend("/api/notifications/ws").replace(/^http/, "ws");
}

/**
 * A single shared websocket connection to the server's notifications endpoint.
 * Notifications are pushed by the server; responses and dismissals are sent back over the same socket.
 */
const store = createRoot(() => {
  const [notifications, setNotifications] = createSignal<ClientNotification[]>([]);
  const responseWaiters = new Map<string, (action?: WorkspacesNotificationAction) => void>();
  const handlers = new Set<(notification: ClientNotification) => void>();

  let socket: WebSocket | undefined;
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  let started = false;

  const send = (message: NotificationClientMessage) => socket?.readyState === WebSocket.OPEN && socket.send(JSON.stringify(message));

  const connect = () => {
    socket = new WebSocket(websocketUrl());

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data) as NotificationServerMessage;

      if (message.type === "sync") {
        setNotifications(message.notifications);
        for (const n of message.notifications) for (const handler of handlers) handler(n);
      } else if (message.type === "notification") {
        setNotifications((current) => [...current.filter((n) => n.uuid !== message.notification.uuid), message.notification]);
        for (const handler of handlers) handler(message.notification);
      } else if (message.type === "dismissed") {
        setNotifications((current) => current.filter((n) => n.uuid !== message.uuid));
      } else if (message.type === "response") {
        responseWaiters.get(message.uuid)?.(message.action);
        responseWaiters.delete(message.uuid);
      }
    };

    socket.onclose = () => {
      socket = undefined;
      if (started) reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS);
    };
  };

  return {
    notifications,
    /** Registers a callback for each notification as it arrives (and for those synced on connect). */
    onNotification(handler: (notification: ClientNotification) => void) {
      handlers.add(handler);

      return () => handlers.delete(handler);
    },
    start() {
      if (started) return;
      started = true;
      connect();
    },
    stop() {
      started = false;
      clearTimeout(reconnectTimer);
      socket?.close();
    },
    dismiss(uuid: string) {
      setNotifications((current) => current.filter((n) => n.uuid !== uuid));
      send({ type: "dismiss", uuid });
    },
    respond(uuid: string, value: string) {
      return new Promise<WorkspacesNotificationAction | undefined>((resolve) => {
        responseWaiters.set(uuid, resolve);
        setNotifications((current) => current.filter((n) => n.uuid !== uuid));

        if (!send({ type: "respond", uuid, value })) {
          responseWaiters.delete(uuid);
          resolve(undefined);
        }
      });
    },
  };
});

export default store;
