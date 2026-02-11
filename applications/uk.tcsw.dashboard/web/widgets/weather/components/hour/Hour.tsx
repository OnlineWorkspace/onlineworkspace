import type { Component } from "solid-js";
import styles from "./Hour.module.scss";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.jsx";
import UKIcon from "@tcsw/uikit-solid/src/components/icon/UKIcon.jsx";

const Hour: Component<{ temperature: number; conditionIcon: string; time: string }> = (props) => {
    return (
        <div class={styles.component}>
            <UKText role="label" size="m">
                {props.temperature}°
            </UKText>
            <UKIcon>{props.conditionIcon}</UKIcon>
            <UKText role="label" size="m">
                {props.time}
            </UKText>
        </div>
    );
};

export default Hour;
