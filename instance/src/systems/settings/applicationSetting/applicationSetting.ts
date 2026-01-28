import { Instance } from "../../../index.js";

export default abstract class ApplicationSetting<T, Global extends boolean> {
    applicationId!: string;
    id!: string;
    defaultValue!: T;
    instance!: Instance;
}
