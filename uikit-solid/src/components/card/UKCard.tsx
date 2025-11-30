import { Match, Switch, type Component, type ParentProps } from "solid-js";
import clsx from "clsx";
import type { CardColor } from "./lib/color";
import styles from "./UKCard.module.scss";

const UKCard: Component<ParentProps<{ class?: string; color?: CardColor; hashId?: string; onClick?: () => void }>> = (props) => {
    return (
        <Switch>
            <Match when={!!props.onClick}>
                <button
                    id={props.hashId}
                    data-color={props.color || "filled"}
                    class={clsx(styles.root, props.class)}
                    onClick={props.onClick}
                    data-clickable={!!props.onClick}
                >
                    {props.children}
                </button>
            </Match>
            <Match when={!props.onClick}>
                <div
                    id={props.hashId}
                    data-color={props.color || "filled"}
                    class={clsx(styles.root, props.class)}
                    onClick={props.onClick}
                    data-clickable={!!props.onClick}
                >
                    {props.children}
                </div>
            </Match>
        </Switch>
    );
};

export default UKCard;
