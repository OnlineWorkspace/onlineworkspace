import UKCard from "@tcsw/uikit-solid/src/components/card/UKCard.tsx";
import styles from "./Widget.module.scss";
import type { Component } from "solid-js";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.tsx";
import UKDivider from "@tcsw/uikit-solid/src/components/divider/UKDivider.tsx";

const Widget: Component = () => {
    return (
        <UKCard class={styles.root}>
            <UKText role={"title"} size={"l"}>
                Notifications
            </UKText>
            <UKDivider direction={"horizontal"} />
            <UKText role={"body"} size={"l"}>
                You have no notifications (Unimplemented)
            </UKText>
        </UKCard>
    );
};

export default Widget;
