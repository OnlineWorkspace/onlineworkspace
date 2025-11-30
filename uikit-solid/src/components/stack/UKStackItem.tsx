import { Match, Switch, type Component, type JSXElement } from "solid-js";
import styles from "./UKStackItem.module.scss";
import UKIcon from "../icon/UKIcon";
import UKText from "../text/UKText";

const UKStackItem: Component<{
    onClick?: () => void;
    component?: JSXElement;
    leading?: {
        type: "image" | "icon";
        value: string;
        alt?: string;
    };
    labelText?: string;
    supportingText?: string;
}> = (props) => {
    return (
        <Switch>
            <Match when={!!props.onClick}>
                <button class={styles.root} data-clickable={!!props.onClick} onClick={props.onClick}>
                    {props.leading?.type === "icon" && <UKIcon class={styles.leadingIcon}>{props.leading.value}</UKIcon>}
                    {props.leading?.type === "image" && (
                        <img class={styles.leadingImage} src={props.leading.value} alt={props.leading.alt || ""} />
                    )}
                    {(props.labelText || props.supportingText) && (
                        <div class={styles.body}>
                            {props.labelText && (
                                <UKText role={"label"} size={"l"} class={styles.labelText}>
                                    {props.labelText}
                                </UKText>
                            )}
                            {props.supportingText && (
                                <UKText role={"body"} size={"m"} class={styles.supportingText}>
                                    {props.supportingText}
                                </UKText>
                            )}
                        </div>
                    )}
                    {props.component}
                </button>
            </Match>
            <Match when={!props.onClick}>
                <div class={styles.root} data-clickable={!!props.onClick} onClick={props.onClick}>
                    {props.leading?.type === "icon" && <UKIcon class={styles.leadingIcon}>{props.leading.value}</UKIcon>}
                    {props.leading?.type === "image" && (
                        <img class={styles.leadingImage} src={props.leading.value} alt={props.leading.alt || ""} />
                    )}
                    {(props.labelText || props.supportingText) && (
                        <div class={styles.body}>
                            {props.labelText && (
                                <UKText role={"label"} size={"l"} class={styles.labelText}>
                                    {props.labelText}
                                </UKText>
                            )}
                            {props.supportingText && (
                                <UKText role={"body"} size={"m"} class={styles.supportingText}>
                                    {props.supportingText}
                                </UKText>
                            )}
                        </div>
                    )}
                    {props.component}
                </div>
            </Match>
        </Switch>
    );
};

export default UKStackItem;
