import type { Component } from "solid-js";
import styles from "./StatusBar.module.scss"
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.tsx";

const StatusBar: Component = () => {
    return <div class={styles.root}>
        <UKText role={"label"} size={"m"}>You currently have no active tasks...</UKText>
    </div>
}

export default StatusBar;
