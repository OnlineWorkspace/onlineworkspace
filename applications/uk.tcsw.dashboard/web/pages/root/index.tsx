import { createResource, type Component } from "solid-js";
import Widgets from "../../widgets/widgets";
import styles from "./index.module.scss";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.jsx";
import trpc from "../../lib/trpc";
import WALLPAPER from "./../../tricolorwallpaper2.svg";

const RootPage: Component = () => {
    const [welcomeMessage] = createResource(() => trpc.dashboard.welcomeMessage.query());

    return (
        <div class={styles.root} style={{ "background-image": `url(${WALLPAPER})` }}>
            <UKText emphasized role="display" size="l" align="center" class={styles.welcomeMessage}>
                {welcomeMessage() || ""}
            </UKText>
            <div class={styles.widgets}>
                <Widgets.user.profile />
                <Widgets.user.profile />
                <Widgets.user.profile />
                <Widgets.user.profile />
                <Widgets.user.profile />
                <Widgets.user.profile />
                <Widgets.user.profile />
                <Widgets.user.profile />
                <Widgets.user.profile />
                <Widgets.user.profile />
                <Widgets.user.profile />
                <Widgets.user.profile />
                <Widgets.user.profile />
                <Widgets.user.profile />
                <Widgets.user.profile />
                <Widgets.user.profile />
            </div>
        </div>
    );
};

export default RootPage;
