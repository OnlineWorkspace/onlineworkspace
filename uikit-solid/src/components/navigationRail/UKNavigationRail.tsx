import { Index, type Component, type JSX, type ParentProps } from "solid-js";
import styles from "./UKNavigationRail.module.scss";
import UKNavigationRailItem from "./item/UKNavigationRailItem";
import UKNavigationRailMenuButton from "./menuButton/UKNavigationRailMenuButton";
import clsx from "clsx";

const UKNavigationRail: Component<
    ParentProps<{
        anchorPoints?: {
            topMost?: JSX.Element;
            top?: JSX.Element;
            bottom?: JSX.Element;
        };
        floatingActionButtons?: {
            icon: string;
            label: string;
            onClick: () => void;
        }[];
        items?: (
            | {
                  icon: { type: "icon" | "image"; value: string };
                  imageIcon?: string;
                  label: string;
                  onClick: () => void;
                  onMiddleClick?: () => void;
                  badgeCount?: number;
                  active?: boolean;
              }
            | undefined
        )[];
        expanded?: boolean;
        setExpanded?: (expanded: boolean) => void;
        type?: "modal" | "surface";
        class?: string;
    }>
> = (props) => {
    return (
        <div class={styles.layout}>
            <div class={clsx(styles.root, props.class)} data-type={props.type || "modal"} data-expanded={props.expanded || false}>
                {props.anchorPoints?.topMost}
                {props.setExpanded && <UKNavigationRailMenuButton setExpanded={props.setExpanded} expanded={props.expanded || false} />}
                {props.anchorPoints?.top}
                {props.items ? (
                    <Index each={props.items.filter((i) => i !== undefined)}>
                        {(i) => <UKNavigationRailItem expanded={props.expanded || false} {...i()} />}
                    </Index>
                ) : null}
                {props.anchorPoints?.bottom}
            </div>
            <div class={styles.pageRoot}>{props.children}</div>
        </div>
    );
};

export default UKNavigationRail;
