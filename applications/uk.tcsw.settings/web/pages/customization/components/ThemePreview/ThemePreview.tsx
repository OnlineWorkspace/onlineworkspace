import ARROW_CIRCLE_RIGHT_ICON from "@material-symbols/svg-700/outlined/arrow_circle_right.svg";
import MENU_ICON from "@material-symbols/svg-700/outlined/menu.svg";
import UKIcon from "@tcsw/uikit-solid/src/components/icon/UKIcon.tsx";
import UKIndeterminateSpinner from "@tcsw/uikit-solid/src/components/indeterminateSpinner/UKIndeterminateSpinner.tsx";
import clsx from "clsx";
import { type Component, createResource, For, Suspense } from "solid-js";
import PLACEHOLDER_WALLPAPER from "./../../../../assets/placeholder_wallpaper.png";
import trpc from "../../../../lib/trpc.ts";
import styles from "./ThemePreview.module.scss";

const ThemePreview: Component<{
  wallpaperOverride?: string;
  align?: ["left" | "center" | "right", "top" | "middle" | "bottom"];
  fillStyle?: "cover" | "fill" | "contain";
}> = (props) => {
  const [currentWallpaper] = createResource(() =>
    trpc.customization.wallpaper.currentWallpaper.query(),
  );

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
          <UKIcon>{MENU_ICON}</UKIcon>
        </div>
        <div class={styles.avatar}></div>
        <div class={styles.items}>
          <For each={new Array(3)}>
            {() => {
              return (
                <div class={styles.item}>
                  <UKIcon>{ARROW_CIRCLE_RIGHT_ICON}</UKIcon>
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
