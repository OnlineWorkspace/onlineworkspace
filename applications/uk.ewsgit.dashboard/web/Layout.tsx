import UKCircularProgressIndicator from "@ewsgit/uikit-solid/src/components/circularProgressIndicator/UKCircularProgressIndicator.tsx";
import clsx from "clsx";
import { type Component, createResource, type ParentProps, Suspense } from "solid-js";
import PLACEHOLDER_WALLPAPER from "./assets/placeholder_wallpaper.png";
import styles from "./Layout.module.scss";
import trpc from "./lib/trpc";

const DashboardLayout: Component<ParentProps> = (props) => {
  const [wallpaper] = createResource(() =>
    trpc.dashboard.getWallpaper.query({
      width: screen.width,
      height: screen.height,
    }),
  );
  const [contentBackground] = createResource(() => trpc.dashboard.getShowContentBackground.query());
  const [wallpaperOptions] = createResource(() => trpc.dashboard.getWallpaperOptions.query());

  return (
    <div class={styles.root} data-show-background={contentBackground()}>
      <Suspense fallback={<UKCircularProgressIndicator class={styles.wallpaperSpinner} />}>
        <img
          onLoad={(e) => {
            e.currentTarget.style.opacity = "1";
            e.currentTarget.style.filter = "blur(0)";
          }}
          alt={""}
          src={wallpaper() || PLACEHOLDER_WALLPAPER}
          style={{
            // @ts-ignore
            "object-fit": wallpaperOptions()?.fit || "cover",
          }}
          class={clsx(styles.wallpaper, styles[wallpaperOptions()?.position?.[0] || "center"], styles[wallpaperOptions()?.position?.[1] || "middle"])}
        />
      </Suspense>
      {props.children}
    </div>
  );
};

export default DashboardLayout;
