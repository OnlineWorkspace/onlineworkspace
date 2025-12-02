import type { Component } from "solid-js";
import UKText from "../../text/UKText";
import UKBadge from "../../badge/UKBadge";
import UKIcon from "../../icon/UKIcon";
import styles from "./UKNavigationRailItem.module.scss";

const UKNavigationRailItem: Component<{
    icon: string;
    imageIcon?: string;
    label: string;
    onClick: () => void;
    onMiddleClick?: () => void;
    badgeCount?: number;
    active?: boolean;
    // not passed to item by the user
    expanded: boolean;
}> = (props) => {
    return (
        <button class={styles.root} data-active={props.active} data-expanded={props.expanded} onClick={props.onClick} onAuxClick={(e) => {
            if (e.button === 1) {
                props.onMiddleClick?.()
            }
        }}>
            {props.badgeCount === undefined ? (
                <>{props.imageIcon !== undefined ? <img /> : <UKIcon class={styles.icon}>{props.icon}</UKIcon>}</>
            ) : (
                <UKBadge class={styles.badge} count={props.badgeCount}>
                    <>{props.imageIcon !== undefined ? <img /> : <UKIcon class={styles.icon}>{props.icon}</UKIcon>}</>
                </UKBadge>
            )}
            <UKText class={styles.label} role="label" size={props.expanded ? "m" : "s"}>
                {props.label}
            </UKText>
        </button>
    );
};

export default UKNavigationRailItem;
