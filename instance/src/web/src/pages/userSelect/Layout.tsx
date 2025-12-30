import UKCard from "@tcsw/uikit-solid/src/components/card/UKCard.jsx";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.jsx";
import { Suspense, type Component } from "solid-js";
import styles from "./Layout.module.scss";
import type { RouteSectionProps } from "@solidjs/router";
import UKIndeterminateSpinner from "@tcsw/uikit-solid/src/components/indeterminateSpinner/UKIndeterminateSpinner.jsx";
import backend from "../../lib/backend";

const UserSelectLayout: Component<RouteSectionProps<unknown>> = (props) => {
    return (
        <div class={styles.root}>
            <img class={styles.background} src={backend("/api/instance/login/background")} />
            <img class={styles.banner} src={backend("/api/instance/login/banner")} />
            <Suspense fallback={<UKIndeterminateSpinner />}>{props.children}</Suspense>
            <UKCard color={"outlined"} class={styles.copyrightContainer}>
                <UKText role={"title"} size={"m"} emphasized={true}>
                    Tricolor Workspaces Alpha
                </UKText>
                <UKText href="https://tcsw.uk" role={"body"} size={"s"} emphasized={true}>
                    © Copyright Tricolor Software 2026
                </UKText>
            </UKCard>
        </div>
    );
};

export default UserSelectLayout;
