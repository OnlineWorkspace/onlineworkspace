import EventEmitter from "node:events";
import type { Server, ServerWebSocket, WebSocketHandler } from "bun";
import type { Instance } from "../index.ts";
import System from "../system.ts";
import { getCookies } from "../utils/cookies.ts";

export enum WorkspacesNoticeType {
  Login,
  Signup,
}

export enum WorkspacesNotificationPriority {
  Normal,
  Important,
  Urgent,
}

export interface WorkspacesNotificationContent {
  title: string;
  icon?: string;
  body: string;
}

export enum WorkspacesNotificationEventEmitterEvent {
  SendNotification = "send_notification",
}

export interface WorkspacesNotificationOptions {
  buttons: { id: string; label: string; type: "filled" | "tonal" }[];
}

export interface WorkspacesNotificationOptionsCallbacks {
  onButton(optionId: string): void | {
    action: { type: "navigate"; value: string } | { type: "reload" };
  };
}

export interface WorkspacesNotification {
  recipient: number;
  sourceId: string;
  priority: WorkspacesNotificationPriority;
  content: WorkspacesNotificationContent;
  uuid: string;
  options?: WorkspacesNotificationOptions;
  optionsCallbacks?: WorkspacesNotificationOptionsCallbacks;
}

/** user-facing names for notification sources; sourceId stays the internal identifier */
const SOURCE_NAMES: Record<string, string> = {
  "authorization.createSession": "Account security",
  "instance.system.application.install": "Applications",
  "instance.system.application.uninstall": "Applications",
  "instance.system.application.enable": "Applications",
  "instance.system.application.disable": "Applications",
  "uk.ewsgit.processorchestrator": "Process Orchestrator",
};

const DEFAULT_SOURCE_NAME = "System";

export const NOTIFICATIONS_WEBSOCKET_PATH = "/api/notifications/ws";

const MAX_PENDING_NOTIFICATIONS_PER_USER = 50;

export type WorkspacesNotificationAction = { type: "navigate"; value: string } | { type: "reload" };

/** A notification as sent over the websocket (callbacks can't be serialised). */
export type WorkspacesNotificationPayload = Omit<WorkspacesNotification, "optionsCallbacks"> & { sourceName: string };

export type NotificationServerMessage =
  | { type: "sync"; notifications: WorkspacesNotificationPayload[] }
  | { type: "notification"; notification: WorkspacesNotificationPayload }
  | { type: "dismissed"; uuid: string }
  | { type: "response"; uuid: string; action?: WorkspacesNotificationAction };

export type NotificationClientMessage = { type: "respond"; uuid: string; value: string } | { type: "dismiss"; uuid: string };

interface NotificationSocketData {
  userId: number;
}

export default class NotificationsSystem extends System {
  eventEmitter: EventEmitter;
  /** notifications which have been sent but not yet responded to or dismissed, by recipient */
  private pending: Map<number, WorkspacesNotification[]> = new Map();
  private sockets: Map<number, Set<ServerWebSocket<NotificationSocketData>>> = new Map();

  constructor(instance: Instance) {
    super("notifications", instance);

    this.eventEmitter = new EventEmitter();
  }

  private toPayload(notification: WorkspacesNotification): WorkspacesNotificationPayload {
    const { optionsCallbacks: _, ...payload } = notification;

    return { ...payload, sourceName: SOURCE_NAMES[notification.sourceId] ?? DEFAULT_SOURCE_NAME };
  }

  private broadcast(userId: number, message: NotificationServerMessage) {
    const data = JSON.stringify(message);

    for (const socket of this.sockets.get(userId) ?? []) {
      socket.send(data);
    }
  }

  private removePending(userId: number, uuid: string) {
    const remaining = (this.pending.get(userId) ?? []).filter((n) => n.uuid !== uuid);

    if (remaining.length === 0) this.pending.delete(userId);
    else this.pending.set(userId, remaining);
  }

  /**
   * Upgrades an authenticated request to the notifications websocket.
   * @returns a Response if the request was rejected, `undefined` if it was upgraded
   */
  async handleUpgrade(req: Request, server: Server<NotificationSocketData>): Promise<Response | undefined> {
    const cookies = getCookies(req.headers);
    const userId = cookies.Authorization ? await this.instance.sys.authorization.verifySession(decodeURIComponent(cookies.Authorization)) : undefined;

    if (userId === undefined) {
      return new Response("Unauthorized", { status: 401 });
    }

    if (!server.upgrade(req, { data: { userId } satisfies NotificationSocketData })) {
      return new Response("Expected a websocket upgrade", { status: 426 });
    }

    return undefined;
  }

  websocketHandler: WebSocketHandler<NotificationSocketData> = {
    open: (socket) => {
      const { userId } = socket.data;
      const sockets = this.sockets.get(userId) ?? new Set();

      sockets.add(socket);
      this.sockets.set(userId, sockets);

      socket.send(
        JSON.stringify({
          type: "sync",
          notifications: (this.pending.get(userId) ?? []).map((n) => this.toPayload(n)),
        } satisfies NotificationServerMessage),
      );
    },
    close: (socket) => {
      const sockets = this.sockets.get(socket.data.userId);

      sockets?.delete(socket);
      if (sockets?.size === 0) this.sockets.delete(socket.data.userId);
    },
    message: (socket, raw) => {
      let message: NotificationClientMessage;

      try {
        message = JSON.parse(raw.toString());
      } catch {
        return;
      }

      const { userId } = socket.data;
      const notification = this.pending.get(userId)?.find((n) => n.uuid === message.uuid);

      if (!notification) return;

      if (message.type === "respond") {
        const result = notification.optionsCallbacks?.onButton(message.value);

        this.removePending(userId, notification.uuid);
        socket.send(JSON.stringify({ type: "response", uuid: notification.uuid, action: result?.action } satisfies NotificationServerMessage));
        this.broadcast(userId, { type: "dismissed", uuid: notification.uuid });
      } else if (message.type === "dismiss") {
        this.removePending(userId, notification.uuid);
        this.broadcast(userId, { type: "dismissed", uuid: notification.uuid });
      }
    },
  };

  // TODO: implement this
  // applyNotice(targetUserId: number, noticeType: WorkspacesNoticeType[], noticeTitle: string, noticeBody: string) {
  //     this.log.warning("Notices are Unimplemented");
  //     return this;
  // }

  send(
    recipient: number,
    sourceId: string,
    priority: WorkspacesNotificationPriority,
    content: WorkspacesNotificationContent,
    options?: WorkspacesNotificationOptions,
    optionsCallbacks?: WorkspacesNotificationOptionsCallbacks,
  ) {
    const notification = {
      recipient,
      sourceId,
      priority,
      content,
      uuid: crypto.randomUUID(),
      options: {
        buttons: options?.buttons || [],
      },
      optionsCallbacks: optionsCallbacks,
    } satisfies WorkspacesNotification;

    this.pending.set(recipient, [...(this.pending.get(recipient) ?? []), notification].slice(-MAX_PENDING_NOTIFICATIONS_PER_USER));
    this.broadcast(recipient, { type: "notification", notification: this.toPayload(notification) });
    this.eventEmitter.emit(WorkspacesNotificationEventEmitterEvent.SendNotification, notification);

    return this;
  }

  override async startup(): Promise<boolean> {
    this.log.info("Starting up...");
    return true;
  }
}
