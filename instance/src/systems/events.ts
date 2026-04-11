import type { Instance } from "../index.js";
import System from "../system.js";

export enum WorkspacesEvent {
  BeforeStartupComplete,
  BeforeShutdown,
  Weekly,
  Daily,
  Hourly,
  HalfHourly,
  QuarterHourly,
  Minutely,
  ApplicationSettingsChanged,
  GlobalApplicationSettingsChanged,
  UpdateAvailable,
  UpdateComplete,
}

export default class EventSystem extends System {
  __internal_eventListeners: { [key in WorkspacesEvent]?: (() => void)[] } = {};

  constructor(instance: Instance) {
    super("event", instance);

    const minutelyTimer = setInterval(() => {
      this.invoke(WorkspacesEvent.Minutely);
    }, 60 * 1000);

    const quarterHourlyTimer = setInterval(
      () => {
        this.invoke(WorkspacesEvent.QuarterHourly);
      },
      15 * 60 * 1000,
    );

    const halfHourlyTimer = setInterval(
      () => {
        this.invoke(WorkspacesEvent.HalfHourly);
      },
      30 * 60 * 1000,
    );

    const hourlyTimer = setInterval(
      () => {
        this.invoke(WorkspacesEvent.Hourly);
      },
      60 * 60 * 1000,
    );

    const dailyTimer = setInterval(
      () => {
        this.invoke(WorkspacesEvent.Daily);
      },
      24 * 60 * 60 * 1000,
    );

    const weeklyTimer = setInterval(
      () => {
        this.invoke(WorkspacesEvent.Weekly);
      },
      7 * 24 * 60 * 60 * 1000,
    );

    this.on(WorkspacesEvent.BeforeShutdown, () => {
      clearInterval(minutelyTimer);
      clearInterval(quarterHourlyTimer);
      clearInterval(halfHourlyTimer);
      clearInterval(hourlyTimer);
      clearInterval(dailyTimer);
      clearInterval(weeklyTimer);
    });
  }

  on(eventType: WorkspacesEvent, cb: () => void) {
    if (!this.__internal_eventListeners[eventType]) {
      this.__internal_eventListeners[eventType] = [];
    }

    this.__internal_eventListeners[eventType].push(cb);

    return this;
  }

  invoke(eventType: WorkspacesEvent) {
    const events = this.__internal_eventListeners[eventType];

    if (!events) {
      return this;
    }

    for (const event of events) {
      event();
    }

    return this;
  }

  async startup(): Promise<boolean> {
    return true;
  }
}
