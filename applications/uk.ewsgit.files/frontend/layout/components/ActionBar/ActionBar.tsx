import ADD_ICON from "@material-symbols/svg-700/outlined/add.svg";
import ARROW_UPWARD_ICON from "@material-symbols/svg-700/outlined/arrow_upward.svg";
import ART_TRACK_ICON from "@material-symbols/svg-700/outlined/art_track.svg";
// import CHEVRON_LEFT_ICON from "@material-symbols/svg-700/outlined/chevron_left.svg";
// import CHEVRON_RIGHT_ICON from "@material-symbols/svg-700/outlined/chevron_right.svg";
import CLOSE_ICON from "@material-symbols/svg-700/outlined/close.svg";
import CROP_SQUARE_ICON from "@material-symbols/svg-700/outlined/crop_square.svg";
import LISTS_ICON from "@material-symbols/svg-700/outlined/lists.svg";
import MINIMIZE_ICON from "@material-symbols/svg-700/outlined/minimize.svg";
// import RIGHT_PANEL_CLOSE_ICON from "@material-symbols/svg-700/outlined/right_panel_close.svg";
// import RIGHT_PANEL_OPEN_ICON from "@material-symbols/svg-700/outlined/right_panel_open.svg";
import UPLOAD_ICON from "@material-symbols/svg-700/outlined/upload.svg";
import VIEW_MODULE_ICON from "@material-symbols/svg-700/outlined/view_module.svg";
import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.tsx";
import UKIconButton from "@ewsgit/uikit-solid/src/components/iconButton/UKIconButton.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import useIsMobile from "@ewsgit/uikit-solid/src/core/useIsMobile.ts";
import clsx from "clsx";
import browserPath from "path-browserify";
import {
  type Component,
  createEffect,
  createSignal,
  Show,
  useContext,
} from "solid-js";
import { AppContext } from "../../../appContext.ts";
import type { UniformResourceLocator } from "../../../lib/filesystemInterface.ts";
import {
  canViewNavigateUp,
  viewNavigateUp,
} from "../../../pages/dir/viewHistory.ts";
import type { ViewItem } from "../../../pages/dir/viewItem.ts";
import styles from "./ActionBar.module.scss";

const ActionBar: Component = () => {
  const isMobile = useIsMobile();
  const appContext = useContext(AppContext);
  const [pathQuery, setPathQuery] = createSignal<string | undefined>(undefined);
  const [showTextualPath, setShowTextualPath] = createSignal<boolean>(false);
  const [canNavigateUp, setCanNavigateUp] = createSignal<boolean>(false);

  createEffect(() => {
    setCanNavigateUp(
      canViewNavigateUp(
        (appContext?.viewState[appContext.globalState.activeViewId].pathUrl ||
          "invalid:") as UniformResourceLocator,
      ),
    );
  });

  return (
    <div class={styles.root}>
      <div class={styles.actionButtons}>
        {
          /* <UKIconButton icon={CHEVRON_LEFT_ICON} color={"standard"} alt={"go back"} onClick={() => window.history.back()} />
        <UKIconButton icon={CHEVRON_RIGHT_ICON} color={"standard"} alt={"go forwards"} onClick={() => window.history.forward()} /> */
        }
        <UKIconButton
          icon={ARROW_UPWARD_ICON}
          color={"standard"}
          disabled={!canNavigateUp()}
          alt={"go up one directory"}
          onClick={() => {
            viewNavigateUp(
              (p) =>
                appContext?.setViewState(
                  appContext.globalState.activeViewId,
                  "pathUrl",
                  p as UniformResourceLocator,
                ),
              (appContext?.viewState[appContext.globalState.activeViewId]
                .pathUrl || "invalid:") as UniformResourceLocator,
            );
          }}
        />
      </div>
      <Show
        when={appContext?.viewState[appContext.globalState.activeViewId]
          .pathUrl !== undefined}
      >
        <div class={styles.pathSelector}>
          <div class={styles.pathSegments}>
            <UKText role="label" size="l">
              {(appContext?.viewState[appContext.globalState.activeViewId]
                .pathUrl || "").split(browserPath.sep)[0].toUpperCase()}
            </UKText>
            {(appContext?.viewState[appContext.globalState.activeViewId]
              .pathUrl || "")
              .split(browserPath.sep)
              .slice(0)
              .map((segment, index) => {
                return (
                  // biome-ignore lint/a11y/useKeyWithClickEvents: todo
                  // biome-ignore lint/a11y/noStaticElementInteractions: todo
                  <div
                    onClick={() => {
                      const fullPath =
                        appContext
                          ?.viewState[appContext.globalState.activeViewId]
                          .pathUrl || "";

                      const segments = fullPath.split(browserPath.sep);

                      const targetPath = segments.slice(0, index + 1).join(
                        browserPath.sep,
                      );

                      appContext?.setViewState(appContext.globalState.activeViewId, "pathUrl", targetPath as UniformResourceLocator)
                    }}
                  >
                    {index !== 0 && (
                      <UKText role="label" size="l">
                        {segment}
                      </UKText>
                    )}
                    {(appContext?.viewState[appContext.globalState.activeViewId]
                            .pathUrl || "").split(browserPath.sep).length -
                          1 === index
                      ? null
                      : (
                        <UKText role="label" size="l">
                          /
                        </UKText>
                      )}
                  </div>
                );
              })}
          </div>
          <input
            class={styles.pathInput}
            type={"text"}
            value={appContext?.viewState[appContext.globalState.activeViewId]
              .pathUrl}
            onKeyDown={(e) => {
              setPathQuery(e.currentTarget.value);
            }}
            onBlur={() => setShowTextualPath(false)}
            onClick={() => setShowTextualPath(true)}
            data-visible={showTextualPath()}
            // TODO: perhaps validate this first and warn the user if it's invalid
            onChange={(e) =>
              appContext?.setViewState(
                appContext.globalState.activeViewId,
                "pathUrl",
                e.currentTarget.value as UniformResourceLocator,
              )}
          />
          <UKCard class={styles.pathSuggestions}>
            {pathQuery()}
            <UKText role={"body"} size={"m"}>
              /Suggestion/1
            </UKText>
            <UKText role={"body"} size={"m"}>
              /Suggestion/2
            </UKText>
            <UKText role={"body"} size={"m"}>
              /Suggestion/3
            </UKText>
            <UKText role={"body"} size={"m"}>
              /Suggestion/4
            </UKText>
          </UKCard>
        </div>
      </Show>
      <div class={styles.actionButtons}>
        <UKIconButton
          icon={LISTS_ICON}
          disabled={appContext?.userPreferences.viewType === "details"}
          color={appContext?.userPreferences.viewType === "details"
            ? "tonal"
            : "standard"}
          alt={"Details View"}
          onClick={() => appContext?.setUserPreferences("viewType", "details")}
        />
        <UKIconButton
          icon={VIEW_MODULE_ICON}
          disabled={appContext?.userPreferences.viewType === "grid"}
          color={appContext?.userPreferences.viewType === "grid"
            ? "tonal"
            : "standard"}
          alt={"Grid View"}
          onClick={() => appContext?.setUserPreferences("viewType", "grid")}
        />
        {!isMobile() && (
          <UKIconButton
            icon={ART_TRACK_ICON}
            disabled={appContext?.userPreferences.viewType === "gallery"}
            color={appContext?.userPreferences.viewType === "gallery"
              ? "tonal"
              : "standard"}
            alt={"Gallery View"}
            onClick={() =>
              appContext?.setUserPreferences("viewType", "gallery")}
          />
        )}
        {!appContext?.isDesktopApp && (
          <>
            <UKIconButton
              icon={UPLOAD_ICON}
              color={"filled"}
              alt={"Upload File"}
              onClick={() => {
                console.log("Does nothing");
              }}
            />
            <UKIconButton
              icon={ADD_ICON}
              color={"filled"}
              alt={"Create File"}
              onClick={() => {
                for (let i = 0; i < 10; i++) {
                  appContext?.setViewState(0, "viewItems", [
                    ...appContext.viewState[0].viewItems,
                    {
                      type: "file",
                      path: `/randomNewItem${
                        Math.round(Math.random() * 100000000)
                      }`,
                    },
                  ] as ViewItem[]);
                }
              }}
            />
          </>
        )}
        {
          /* {!isMobile() && (
          <UKIconButton
            icon={appContext?.userPreferences.showPreview ? RIGHT_PANEL_OPEN_ICON : RIGHT_PANEL_CLOSE_ICON}
            color={"filled"}
            alt={"Toggle Preview"}
            onClick={() => {
              appContext?.setUserPreferences("showPreview", !appContext?.userPreferences.showPreview);
            }}
          />
        )} */
        }
        {appContext?.isDesktopApp &&
          localStorage.getItem("onlineworkspace_workspace_desktop_platform") !==
            "darwin" &&
          (
            <>
              <UKIconButton
                icon={MINIMIZE_ICON}
                color={"standard"}
                size="s"
                shape="square"
                alt={"minimize window"}
                class={styles.windowIcon}
                onClick={() => {
                  // @ts-ignore
                  window.electronAPI.minimize_window();
                }}
              />
              <UKIconButton
                icon={CROP_SQUARE_ICON}
                color={"standard"}
                size="s"
                shape="square"
                alt={"maximize window"}
                class={styles.windowIcon}
                onClick={() => {
                  // @ts-ignore
                  window.electronAPI.maximize_window();
                }}
              />
              <UKIconButton
                icon={CLOSE_ICON}
                color={"standard"}
                size="s"
                shape="square"
                alt={"close window"}
                class={clsx(styles.closeWindowIcon, styles.windowIcon)}
                onClick={() => {
                  // @ts-ignore
                  window.electronAPI.close_window();
                }}
              />
            </>
          )}
      </div>
    </div>
  );
};

export default ActionBar;
