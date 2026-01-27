export default abstract class ApplicationSetting<T, Global extends boolean> {
    id!: string;
    defaultValue!: T;
    global?: Global;
}
