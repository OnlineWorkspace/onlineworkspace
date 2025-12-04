import type {Component} from "solid-js";
import UKText from "../../text/UKText";
import UKBadge from "../../badge/UKBadge";
import UKIcon from "../../icon/UKIcon";
import styles from "./UKNavigationRailItem.module.scss";

const UKNavigationRailItem: Component<{
    icon: {type: "icon" | "image", value: string};
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
                <>{props.icon.type === "image" ? <img class={styles.imageIcon} src={props.icon.value} /> : <UKIcon class={styles.icon}>{props.icon.value}</UKIcon>}</>
            ) : (
                <UKBadge class={styles.badge} count={props.badgeCount}>
                        <>{props.icon.type === "image" ? <img class={styles.imageIcon} src={props.icon.value} /> : <UKIcon class={styles.icon}>{props.icon.value}</UKIcon>}</>
                </UKBadge>
            )}
            <UKText class={styles.label} role="label" size={props.expanded ? "m" : "s"}>
                {props.label}
            </UKText>
        </button>
    );
};

export default UKNavigationRailItem;
