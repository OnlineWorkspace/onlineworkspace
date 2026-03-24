import EDIT_ICON from "@material-symbols/svg-700/outlined/edit.svg";
import SEARCH_ICON from "@material-symbols/svg-700/outlined/search.svg";
import SETTINGS_ICON from "@material-symbols/svg-700/outlined/settings.svg";
import { useNavigate, useSearchParams } from "@solidjs/router";
import UKButton from "@tcsw/uikit-solid/src/components/button/UKButton.jsx";
import UKDialog from "@tcsw/uikit-solid/src/components/dialog/UKDialog.jsx";
import UKIconButton from "@tcsw/uikit-solid/src/components/iconButton/UKIconButton.jsx";
import UKIndeterminateSpinner from "@tcsw/uikit-solid/src/components/indeterminateSpinner/UKIndeterminateSpinner.jsx";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.jsx";
import clsx from "clsx";
import {
  type Component,
  createEffect,
  createResource,
  createSignal,
  For,
  Suspense,
} from "solid-js";
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
  const [welcomeMessage] = createResource(() => trpc.dashboard.getWelcomeMessage.query(Date.now()));
  const [contentBackground] = createResource(() => trpc.dashboard.getShowContentBackground.query());
  const [showEditButton] = createResource(() => trpc.dashboard.getShowEditButton.query());
  const [showSearchBar] = createResource(() => trpc.dashboard.getShowSearchBar.query());
  const [searchBarOpenInNewTab] = createResource(() =>
    trpc.dashboard.getOpenSearchInNewTab.query(),
  );
  const [searchBarSearchEngine] = createResource(() =>
    trpc.dashboard.getSearchBarSearchEngine.query(),
  );
  const [searchQuery, setSearchQuery] = createSignal("");
  const [showEditWidgets, setShowEditWidgets] = createSignal(false);
  const [searchParams] = useSearchParams();

  createEffect(() => {
    if (searchParams.editWidgets === "true") {
      setShowEditWidgets(true);
    } else {
      setShowEditWidgets(false);
    }
  });

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
            value={searchQuery()}
            onChange={(e) => {
              setSearchQuery(e.currentTarget.value);
            }}
            onKeyUp={(e) => {
              setSearchQuery(e.currentTarget.value);
              if (e.key === "Enter") {
                const url = searchBarSearchEngine()!.replace(
                  "%s",
                  encodeURIComponent(searchQuery()),
                )!;

                if (searchBarOpenInNewTab()) {
                  window.open(url, "_blank");
                } else {
                  window.location.href = url;
                }

                setSearchQuery("");
              }
            }}
          />
          <UKIconButton
            class={styles.searchBarSearch}
            icon={SEARCH_ICON}
            disabled={searchQuery().length === 0}
            shape="square"
            color={"filled"}
            onClick={() => {
              const url = searchBarSearchEngine()!.replace(
                "%s",
                encodeURIComponent(searchQuery()),
              )!;

              if (searchBarOpenInNewTab()) {
                window.open(url, "_blank");
              } else {
                window.location.href = url;
              }

              setSearchQuery("");
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
        <div class={styles.editButtonContainer}>
          <UKButton
            leadingIcon={EDIT_ICON}
            onClick={() => {
              setShowEditWidgets(true);
              // navigate(
              //   "/app/uk.tcsw.settings/applications/uk.tcsw.dashboard?origin=/app/uk.tcsw.dashboard",
              // );
            }}
            color={"tonal"}
          >
            Edit widgets
          </UKButton>
          <UKIconButton
            alt="open settings"
            icon={SETTINGS_ICON}
            onClick={() => {
              navigate(
                "/app/uk.tcsw.settings/applications/uk.tcsw.dashboard?origin=/app/uk.tcsw.dashboard",
              );
            }}
            color={"tonal"}
          />
        </div>
      )}
    </div>
  );
};

export default RootPage;
