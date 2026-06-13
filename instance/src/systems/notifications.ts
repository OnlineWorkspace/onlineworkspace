import EventEmitter from "node:events";
import type { Instance } from "../index.ts";
import System from "../system.ts";

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

export default class NotificationsSystem extends System {
  eventEmitter: EventEmitter;

  constructor(instance: Instance) {
    super("notifications", instance);

    this.eventEmitter = new EventEmitter();
  }

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
    this.eventEmitter.emit(WorkspacesNotificationEventEmitterEvent.SendNotification, {
      recipient,
      sourceId,
      priority,
      content,
      uuid: crypto.randomUUID(),
      options: {
        buttons: options?.buttons || [],
      },
      optionsCallbacks: optionsCallbacks,
    } satisfies WorkspacesNotification);

    return this;
  }

  override async startup(): Promise<boolean> {
    this.log.info("Starting up...");
    return true;
  }
}
