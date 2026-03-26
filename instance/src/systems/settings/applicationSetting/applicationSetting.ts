import type { Instance } from "../../../index.js";

export abstract class ApplicationSetting<T> {
  applicationId!: string;
  id!: string;
  displayName!: string;
  defaultValue!: T;
  type!: string;
  instance!: Instance;
  description!: string;
  hidden!: boolean;

  abstract getValue(userId: number): Promise<T>;
  abstract setValue(userId: number, value: T): Promise<boolean>;
  abstract setHidden(hidden: boolean): this;
}

export abstract class GlobalApplicationSetting<T> {
  applicationId!: string;
  id!: string;
  displayName!: string;
  defaultValue!: T;
  type!: string;
  instance!: Instance;
  description!: string;
  hidden!: boolean;

  abstract getValue(): Promise<T>;
  abstract setValue(value: T): Promise<boolean>;
  abstract setHidden(hidden: boolean): this;
}
