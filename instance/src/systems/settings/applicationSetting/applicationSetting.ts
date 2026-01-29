import { Instance } from "../../../index.js";

export default abstract class ApplicationSetting<T> {
    applicationId!: string;
    id!: string;
    displayName!: string;
    defaultValue!: T;
    type!: string;
    instance!: Instance;
}
