import { createResource, Suspense, type Component } from "solid-js";
import Widgets from "../../widgets/widgets";
import styles from "./index.module.scss";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.jsx";
import trpc from "../../lib/trpc";
import UKIndeterminateSpinner from "@tcsw/uikit-solid/src/components/indeterminateSpinner/UKIndeterminateSpinner.jsx";
import clsx from "clsx";
import PLACEHOLDER_WALLPAPER from "./../../assets/placeholder_wallpaper.png";

const RootPage: Component = () => {
    const [wallpaper] = createResource(() =>
        trpc.dashboard.getWallpaper.query({ width: screen.width, height: screen.height }),
    );
    const [wallpaperOptions] = createResource(() => trpc.dashboard.getWallpaperOptions.query());
    const [welcomeMessage] = createResource(() => trpc.dashboard.welcomeMessage.query());

    return (
        <div class={styles.root}>
            <Suspense fallback={<UKIndeterminateSpinner class={styles.wallpaperSpinner} />}>
                <img
                    alt={""}
                    src={wallpaper() || PLACEHOLDER_WALLPAPER}
                    style={{
                        // @ts-ignore
                        "object-fit": wallpaperOptions()?.fit || "cover",
                    }}
                    class={clsx(
                        styles.wallpaper,
                        styles[wallpaperOptions()?.position?.[0] || "center"],
                        styles[wallpaperOptions()?.position?.[1] || "middle"],
                    )}
                />
            </Suspense>
            <UKText emphasized role="display" size="l" align="center" class={styles.welcomeMessage}>
                {welcomeMessage() || ""}
            </UKText>
            <div class={styles.widgets}>
                <Widgets.user.profile />
                <UKText role={"body"} size="l" align={"center"} emphasized>
                    Place Widgets Here!
                </UKText>
            </div>
        </div>
    );
};

export default RootPage;
