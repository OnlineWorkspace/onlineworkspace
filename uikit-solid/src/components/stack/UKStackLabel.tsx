import type { Component } from "solid-js";
import styles from "./UKStackLabel.module.scss"
import UKText from "../text/UKText.tsx";

const UKStackLabel: Component<{ children: string }> = (props) => {
    return (
      <UKText class={styles.component} role="title" size="m" align="start">
        {props.children}
      </UKText>
    );
}

export default UKStackLabel
