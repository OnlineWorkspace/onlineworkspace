import UKCard from "@tcsw/uikit-solid/src/components/card/UKCard.tsx";
import styles from "./Widget.module.scss";
import type { Component } from "solid-js";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.tsx";
import UKIcon from "@tcsw/uikit-solid/src/components/icon/UKIcon.jsx";
import Hour from "./components/hour/Hour";

const Widget: Component = () => {
    return (
        <UKCard class={styles.root}>
            <UKText role={"title"} size={"s"}>
                Weather For [LocationName]
            </UKText>
            <div class={styles.header}>
                <div class={styles.overviewContainer}>
                    <div class={styles.overviewCondition}>
                        <UKIcon class={styles.overviewIcon}>cloud</UKIcon>
                        <UKText role="headline" size="m">
                            Cloudy
                        </UKText>
                    </div>
                    <UKText role="body" size="m">
                        Feels like 5°
                    </UKText>
                    <div class={styles.overviewHighLow}>
                        <UKText role="body" size="m">
                            8°
                        </UKText>
                        <UKText class={styles.overviewHighLowSeparator} role="body" size="m">
                            ·
                        </UKText>
                        <UKText role="body" size="m">
                            6°
                        </UKText>
                    </div>
                </div>
                <UKText emphasized size="l" role="display">
                    7°
                </UKText>
            </div>
            <UKCard color="elevated" class={styles.hours}>
                <Hour conditionIcon="cloud" temperature={9} time="Now" />
                <Hour conditionIcon="sunny" temperature={9} time="13:00" />
                <Hour conditionIcon="rainy" temperature={9} time="14:00" />
                <Hour conditionIcon="cloud" temperature={9} time="15:00" />
                <Hour conditionIcon="cloud" temperature={9} time="15:00" />
                <Hour conditionIcon="cloud" temperature={9} time="15:00" />
                <Hour conditionIcon="cloud" temperature={9} time="15:00" />
                <Hour conditionIcon="cloud" temperature={9} time="15:00" />
                <Hour conditionIcon="cloud" temperature={9} time="15:00" />
            </UKCard>
            <UKText size="s" role="label" class={styles.dataSource}>
                Source Open-Meteo
            </UKText>
        </UKCard>
    );
};

export default Widget;
