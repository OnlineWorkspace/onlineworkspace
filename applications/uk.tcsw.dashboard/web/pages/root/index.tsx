import EDIT_ICON from "@material-symbols/svg-700/outlined/edit.svg";
import SEARCH_ICON from "@material-symbols/svg-700/outlined/search.svg";
import { useNavigate } from "@solidjs/router";
import UKButton from "@tcsw/uikit-solid/src/components/button/UKButton.jsx";
import UKIconButton from "@tcsw/uikit-solid/src/components/iconButton/UKIconButton.jsx";
import UKIndeterminateSpinner from "@tcsw/uikit-solid/src/components/indeterminateSpinner/UKIndeterminateSpinner.jsx";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.jsx";
import clsx from "clsx";
import { type Component, createResource, createSignal, For, Suspense } from "solid-js";
import PLACEHOLDER_WALLPAPER from "./../../assets/placeholder_wallpaper.png";
import trpc from "../../lib/trpc";
import Widgets from "../../widgets/widgets";
import styles from "./index.module.scss";

const RootPage: Component = () => {
  const navigate = useNavigate();
  const [wallpaper] = createResource(() =>
    trpc.dashboard.getWallpaper.query({
      width: screen.width,
      height: screen.height,
    }),
  );
  const [widgets] = createResource(() => trpc.dashboard.getWidgets.query());
  const [wallpaperOptions] = createResource(() => trpc.dashboard.getWallpaperOptions.query());
  const [welcomeMessage] = createResource(() => trpc.dashboard.welcomeMessage.query(Date.now()));
  const [contentBackground] = createResource(() => trpc.dashboard.contentBackground.query());
  const [showEditButton] = createResource(() => trpc.dashboard.showEditButton.query());
  const [showSearchBar] = createResource(() => trpc.dashboard.showSearchBar.query());
  const [searchQuery, setSearchQuery] = createSignal("");

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
      {showSearchBar() && (
        <div class={styles.searchBar}>
          <input
            type="text"
            class={styles.searchBarInput}
            placeholder="Search..."
            onKeyDown={(e) => {
              setSearchQuery(e.currentTarget.value);
              if (e.key === "Enter") {
                window.location.href = `https://duckduckgo.com/?q=${encodeURIComponent(searchQuery())}`;
              }
            }}
          />
          <UKIconButton
            class={styles.searchBarSearch}
            icon={SEARCH_ICON}
            shape="square"
            color={"filled"}
            onClick={() => {
              window.location.href = `https://duckduckgo.com/?q=${encodeURIComponent(searchQuery())}`;
            }}
            alt="search"
          />
        </div>
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
      {showEditButton() && (
        <UKButton
          leadingIcon={EDIT_ICON}
          onClick={() => {
            navigate(
              "/app/uk.tcsw.settings/applications/uk.tcsw.dashboard?origin=/app/uk.tcsw.dashboard",
            );
          }}
          color={"tonal"}
        >
          Edit widgets
        </UKButton>
      )}
    </div>
  );
};

export default RootPage;
