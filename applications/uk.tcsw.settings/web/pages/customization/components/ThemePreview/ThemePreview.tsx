import { type Component, createResource, For, Suspense } from "solid-js";
import styles from "./ThemePreview.module.scss";
import UKIcon from "@tcsw/uikit-solid/src/components/icon/UKIcon.tsx";
import trpc from "../../../../lib/trpc.ts";
import UKIndeterminateSpinner from "@tcsw/uikit-solid/src/components/indeterminateSpinner/UKIndeterminateSpinner.tsx";
import PLACEHOLDER_WALLPAPER from "./../../../../assets/placeholder_wallpaper.png";
import clsx from "clsx";

const ThemePreview: Component<{
    wallpaperOverride?: string;
    align?: ["left" | "center" | "right", "top" | "middle" | "bottom"];
    fillStyle?: "cover" | "fill" | "contain";
}> = (props) => {
    const [currentWallpaper] = createResource(() => trpc.customization.wallpaper.currentWallpaper.query());

    return (
        <div class={styles.root}>
            <Suspense fallback={<UKIndeterminateSpinner class={styles.wallpaperSpinner} />}>
                <img
                    alt={""}
                    src={props.wallpaperOverride ?? currentWallpaper() ?? PLACEHOLDER_WALLPAPER}
                    style={{
                        "object-fit": props.fillStyle || "cover",
                    }}
                    class={clsx(
                        styles.wallpaper,
                        styles[props.align?.[0] || "center"],
                        styles[props.align?.[1] || "middle"],
                    )}
                />
            </Suspense>
            <div class={styles.sidebar}>
                <div class={styles.menuButton}>
                    <UKIcon>menu</UKIcon>
                </div>
                <div class={styles.avatar}></div>
                <div class={styles.items}>
                    <For each={new Array(3)}>
                        {() => {
                            return (
                                <div class={styles.item}>
                                    <UKIcon>arrow_circle_right</UKIcon>
                                </div>
                            );
                        }}
                    </For>
                </div>
            </div>
        </div>
    );
};

export default ThemePreview;
