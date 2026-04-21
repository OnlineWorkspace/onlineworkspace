import clsx from "clsx";
import { type Component, type JSX, Match, type ParentProps, Switch } from "solid-js";
import type { CardColor } from "./lib/color";
import styles from "./UKCard.module.scss";

const UKCard: Component<
  ParentProps<{
    class?: string;
    color?: CardColor;
    hashId?: string;
    onClick?: JSX.EventHandler<HTMLButtonElement, MouseEvent>;
    [key: `data-${string}`]: string;
  }>
> = (props) => {
  return (
    <Switch>
      <Match when={!!props.onClick}>
        <button
          type={"button"}
          {...props}
          id={props.hashId}
          data-color={props.color || "filled"}
          class={clsx(styles.root, props.class)}
          data-clickable={!!props.onClick}
        >
          {props.children}
        </button>
      </Match>
      <Match when={!props.onClick}>
        <div
          {...(props as Omit<typeof props, "onClick">)}
          id={props.hashId}
          data-color={props.color || "filled"}
          class={clsx(styles.root, props.class)}
          data-clickable={!!props.onClick}
        >
          {props.children}
        </div>
      </Match>
    </Switch>
  );
};

export default UKCard;
