import { Match, Switch, type Component, type ParentProps } from "solid-js";
import styles from "./UKText.module.scss";
import clsx from "clsx";

const UKText: Component<
    ParentProps<{
        role: "display" | "headline" | "title" | "body" | "label";
        emphasized?: boolean;
        size: "l" | "m" | "s";
        align?: "start" | "center" | "end";
        class?: string;
        href?: string;
        onClick?: (e: MouseEvent) => void;
    }>
> = (props) => {
    return (
        <Switch>
            <Match when={props.href}>
                <a
                    onClick={props.onClick}
                    class={clsx(styles.root, props.class)}
                    data-size={props.size || "s"}
                    data-role={props.role || "body"}
                    data-emphasized={props.emphasized || false}
                    data-align={props.align || "start"}
                    href={props.href}
                >
                    {props.children}
                </a>
            </Match>
            <Match when={props.href === undefined}>
                <div
                    onClick={props.onClick}
                    class={clsx(styles.root, props.class)}
                    data-size={props.size || "s"}
                    data-role={props.role || "body"}
                    data-emphasized={props.emphasized || false}
                    data-align={props.align || "start"}
                >
                    {props.children}
                </div>
            </Match>
        </Switch>
    );
};

export default UKText;
