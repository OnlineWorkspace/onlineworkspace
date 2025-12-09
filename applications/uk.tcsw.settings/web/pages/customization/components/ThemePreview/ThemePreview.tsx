import { createResource, For, type Component } from "solid-js";
import styles from "./ThemePreview.module.scss";
import UKIcon from "@tcsw/uikit-solid/src/components/icon/UKIcon.tsx";
import trpc from "../../../../lib/trpc.ts";

const ThemePreview: Component<{ wallpaperOverride?: string }> = (props) => {
    const [currentWallpaper] = createResource(() => trpc.customization.wallpaper.currentWallpaper.query());

    return (
        <div class={styles.root}>
            <img src={props.wallpaperOverride || currentWallpaper() || "/assets/tricolor/tricolor.svg"} class={styles.wallpaper} />
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
