import ADD_ICON from "@material-symbols/svg-700/outlined/add.svg";
import ARROW_UPWARD_ICON from "@material-symbols/svg-700/outlined/arrow_upward.svg";
import ART_TRACK_ICON from "@material-symbols/svg-700/outlined/art_track.svg";
import CHEVRON_LEFT_ICON from "@material-symbols/svg-700/outlined/chevron_left.svg";
import CHEVRON_RIGHT_ICON from "@material-symbols/svg-700/outlined/chevron_right.svg";
import LISTS_ICON from "@material-symbols/svg-700/outlined/lists.svg";
import UPLOAD_ICON from "@material-symbols/svg-700/outlined/upload.svg";
import VIEW_MODULE_ICON from "@material-symbols/svg-700/outlined/view_module.svg";
import UKIconButton from "@onlineworkspace/uikit-solid/src/components/iconButton/UKIconButton.tsx";
import { useSearchParams } from "@solidjs/router";
import browserPath from "path-browserify";
import { type Component, Show, useContext } from "solid-js";
import { AppContext } from "../../../appContext.ts";
import type { ViewItem } from "../../../pages/dir/viewItem.ts";
import styles from "./ActionBar.module.scss";

const ActionBar: Component = () => {
  const appContext = useContext(AppContext);
  const [searchParams, setSearchParams] = useSearchParams<{ path: string }>();

  return (
    <div class={styles.root}>
      <div class={styles.actionButtons}>
        <UKIconButton icon={CHEVRON_LEFT_ICON} color={"standard"} alt={"go back"} onClick={() => window.history.back()} />
        <UKIconButton icon={CHEVRON_RIGHT_ICON} color={"standard"} alt={"go forwards"} onClick={() => window.history.forward()} />
        <UKIconButton
          icon={ARROW_UPWARD_ICON}
          color={"standard"}
          alt={"go up one directory"}
          onClick={() => {
            console.log("Implement this");
          }}
        />
      </div>
      <Show when={searchParams.path !== undefined}>
        <div class={styles.pathSelector}>
          <div class={styles.pathSegments}>
            {/* Path Segments */}
            {(searchParams.path || "").split(browserPath.sep).join(" / ")}
          </div>
          <input class={styles.pathInput} type={"text"} value={searchParams.path} onChange={(e) => setSearchParams({ path: e.currentTarget.value })} />
        </div>
      </Show>
      <div class={styles.actionButtons}>
        <UKIconButton
          icon={LISTS_ICON}
          disabled={appContext?.userPreferences.viewType === "details"}
          color={appContext?.userPreferences.viewType === "details" ? "tonal" : "standard"}
          alt={"Details View"}
          onClick={() => appContext?.setUserPreferences("viewType", "details")}
        />
        <UKIconButton
          icon={VIEW_MODULE_ICON}
          disabled={appContext?.userPreferences.viewType === "grid"}
          color={appContext?.userPreferences.viewType === "grid" ? "tonal" : "standard"}
          alt={"Grid View"}
          onClick={() => appContext?.setUserPreferences("viewType", "grid")}
        />
        <UKIconButton
          icon={ART_TRACK_ICON}
          disabled={appContext?.userPreferences.viewType === "gallery"}
          color={appContext?.userPreferences.viewType === "gallery" ? "tonal" : "standard"}
          alt={"Gallery View"}
          onClick={() => appContext?.setUserPreferences("viewType", "gallery")}
        />
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
            appContext?.setViewState("viewItems", [
              ...appContext.viewState.viewItems,
              { type: "file", path: `/randomNewItem${Math.round(Math.random() * 10000)}` },
            ] as ViewItem[]);
          }}
        />
      </div>
    </div>
  );
};

export default ActionBar;
