import { createResource, For, Suspense, type Component } from "solid-js";
import Widgets from "../../widgets/widgets";
import styles from "./index.module.scss";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.jsx";
import trpc from "../../lib/trpc";
import UKIndeterminateSpinner from "@tcsw/uikit-solid/src/components/indeterminateSpinner/UKIndeterminateSpinner.jsx";
import clsx from "clsx";
import PLACEHOLDER_WALLPAPER from "./../../assets/placeholder_wallpaper.png";
import UKButton from "@tcsw/uikit-solid/src/components/button/UKButton.jsx";
import { useNavigate } from "@solidjs/router";

const RootPage: Component = () => {
    const navigate = useNavigate();
    const [wallpaper] = createResource(() =>
        trpc.dashboard.getWallpaper.query({ width: screen.width, height: screen.height }),
    );
    const [widgets] = createResource(() => trpc.dashboard.getWidgets.query());
    const [wallpaperOptions] = createResource(() => trpc.dashboard.getWallpaperOptions.query());
    const [welcomeMessage] = createResource(() => trpc.dashboard.welcomeMessage.query());
    const [contentBackground] = createResource(() => trpc.dashboard.contentBackground.query());

    return (
        <div class={styles.root} data-show-background={contentBackground()}>
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
            {welcomeMessage() && (
                <UKText emphasized role="display" size="l" align="center" class={styles.welcomeMessage}>
                    {welcomeMessage()}
                </UKText>
            )}
            <div class={styles.widgets}>
                <For each={widgets()}>
                    {(widgetId) => {
                        // @ts-ignore
                        const Widget = Widgets[widgetId];

                        if (!Widget)
                            return (
                                <UKText role={"body"} size="l" align={"center"} emphasized>
                                    Invalid WidgetId '{widgetId}'
                                </UKText>
                            );

                        return <Widget />;
                    }}
                </For>
            </div>
            <UKButton
                leadingIcon={"edit"}
                onClick={() => {
                    navigate("/app/uk.tcsw.settings/applications/uk.tcsw.dashboard?origin=/app/uk.tcsw.dashboard");
                }}
                color={"tonal"}
            >
                Edit widgets
            </UKButton>
        </div>
    );
};

export default RootPage;
