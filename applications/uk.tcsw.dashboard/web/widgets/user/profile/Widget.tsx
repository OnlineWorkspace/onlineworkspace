import UKAvatar from "@tcsw/uikit-solid/src/components/avatar/UKAvatar.jsx";
import UKCard from "@tcsw/uikit-solid/src/components/card/UKCard.jsx";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.jsx";
import { createResource, type Component } from "solid-js";
import styles from "./Widget.module.scss";
import trpc from "../../../lib/trpc";

const Widget: Component = () => {
    const [userData] = createResource(() => trpc.dashboard.widgets.user.profile.query());

    return (
        <UKCard class={styles.root}>
            <UKAvatar avatar={userData()?.avatar || "/assets/placeholder/avatar.png"} size="m" username="username" />
            <div>
                <UKText role="title" align="start" emphasized size="l">
                    {userData()?.displayName || "Unknown"}
                </UKText>
                <UKText role="label" align="start" size="s">
                    {`@${userData()?.username || "Unknown"}`}
                </UKText>
            </div>
        </UKCard>
    );
};

export default Widget;
