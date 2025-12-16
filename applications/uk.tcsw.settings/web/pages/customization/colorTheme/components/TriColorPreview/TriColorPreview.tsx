import type { Component } from "solid-js";
import styles from "./TriColorPreview.module.scss";
import UKCard from "@tcsw/uikit-solid/src/components/card/UKCard.jsx";

const QuadColorPreview: Component<{ colors: string[] }> = (props) => {
    return (
        <UKCard color="filled" class={styles.root}>
            <div class={styles.colorOne} style={{ background: props.colors[0] }}></div>
            <div class={styles.colorTwo} style={{ background: props.colors[1] }}></div>
            <div class={styles.colorThree} style={{ background: props.colors[2] }}></div>
        </UKCard>
    );
};

export default QuadColorPreview;
