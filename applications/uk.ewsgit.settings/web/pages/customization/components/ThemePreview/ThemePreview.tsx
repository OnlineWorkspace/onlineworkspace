import ARROW_CIRCLE_RIGHT_ICON from "@material-symbols/svg-700/outlined/arrow_circle_right.svg";
import MENU_ICON from "@material-symbols/svg-700/outlined/menu.svg";
import UKIcon from "@ewsgit/uikit-solid/src/components/icon/UKIcon.tsx";
import { type Component, createResource, For, Suspense } from "solid-js";
import PLACEHOLDER_WALLPAPER from "./../../../../assets/placeholder_wallpaper.png";
import trpc from "../../../../lib/trpc.ts";
import { previewWallpaperDimensions } from "../../../../lib/wallpaperPreview.ts";
import styles from "./ThemePreview.module.scss";

/**
 * Shows the wallpaper the same way the dashboard does: the server-resized image fills its area and
 * is displayed using the saved fit option.
 */
const ThemePreview: Component<{
  wallpaperOverride?: string;
  /** the wallpaper fit currently saved on the server, defaults to what the dashboard uses when nothing is saved */
  fit?: string;
}> = (props) => {
  const [currentWallpaper] = createResource(() => trpc.customization.wallpaper.getCurrentWallpaper.query(previewWallpaperDimensions()));
  const [options] = createResource(() => trpc.customization.wallpaper.getOptions.query());

  return (
    <div class={styles.root}>
      <Suspense>
        <img
          draggable={false}
          onLoad={(e) => {
            e.currentTarget.style.opacity = "1";
            e.currentTarget.style.filter = "blur(0)";
          }}
          alt={""}
          src={props.wallpaperOverride ?? currentWallpaper() ?? PLACEHOLDER_WALLPAPER}
          style={{
            // @ts-ignore same expression the dashboard uses
            "object-fit": props.fit ?? options()?.fit ?? "cover",
          }}
          class={styles.wallpaper}
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
