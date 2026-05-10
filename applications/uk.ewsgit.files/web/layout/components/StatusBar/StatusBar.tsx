import VIEW_REAL_SIZE_ICON from "@material-symbols/svg-700/outlined/view_real_size.svg";
import ZOOM_IN_ICON from "@material-symbols/svg-700/outlined/zoom_in.svg";
import ZOOM_OUT_ICON from "@material-symbols/svg-700/outlined/zoom_out.svg";
import UKDivider from "@ewsgit/uikit-solid/src/components/divider/UKDivider.jsx";
import UKIconButton from "@ewsgit/uikit-solid/src/components/iconButton/UKIconButton.jsx";
import UKLinearProgressIndicator from "@ewsgit/uikit-solid/src/components/linearProgressIndicator/UKLinearProgressIndicator.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import clsx from "clsx";
import { type Component, createEffect, createSignal, useContext } from "solid-js";
import { AppContext } from "../../../appContext.ts";
import { MAX_ZOOM_VALUE, MIN_ZOOM_VALUE } from "../../../lib/constants.ts";
import humanReadableSize from "../../../lib/humanReadableSize.ts";
import { ViewContext } from "../../../pages/dir/viewContext.ts";
import styles from "./StatusBar.module.scss";

const StatusBar: Component = () => {
  const appContext = useContext(AppContext);
  const viewContext = useContext(ViewContext);
  const [dirContents, setDirContents] = createSignal<string>("");

  createEffect(() => {
    const viewItems = appContext?.viewState[viewContext!.viewId].viewItems;

    let outputString = "";

    const directories = viewItems?.filter((item) => item.type === "directory") || [];
    const files = viewItems?.filter((item) => item.type === "file") || [];

    if (directories.length > 0) {
      outputString += `${directories.length} Folder${directories.length !== 1 ? "s" : ""}${files.length > 0 ? ", " : ""}`;
    }

    if (files.length > 0) {
      outputString += `${files.length} File${files.length !== 1 ? "s" : ""}`;
    }

    let totalSize = 0;

    for (const directory of directories) {
      if (directory.size) totalSize += directory.size;
    }

    for (const file of files) {
      if (file.size) totalSize += file.size;
    }

    if (totalSize > 0) {
      outputString += ` (${humanReadableSize(totalSize)})`;
    }

    const selectedItems = appContext?.viewState[viewContext!.viewId].selectedItems || [];

    if (selectedItems?.length > 0) {
      outputString += ` - Selected ${selectedItems.length} item${selectedItems.length !== 1 ? "s" : ""}`;
    }

    if (outputString === "") {
      outputString = "Empty directory";
    }

    setDirContents(outputString);
  });

  createEffect(() => {
    for (const task of appContext?.viewState[viewContext!.viewId].tasks || []) {
      console.log(JSON.stringify(task));
      if (task.current === task.max) {
        setTimeout(() => {
          appContext?.setViewState(viewContext!.viewId, "tasks", (tasks) =>
            tasks.map((t) => {
              if (t.id === task.id) {
                return {
                  ...t,
                  invalid: true,
                };
              }

              return t;
            }),
          );

          setTimeout(() => {
            appContext?.setViewState(viewContext!.viewId, "tasks", (tasks) => tasks.filter((t) => t.id !== task.id));
          }, 250);
        }, 1000);
      }
    }
  });

  return (
    <div class={styles.root}>
      <UKText role={"label"} size={"m"}>
        {dirContents()}
      </UKText>
      <div class={styles.margin}></div>
      <div
        class={clsx(
          styles.taskStatus,
          appContext?.viewState[viewContext!.viewId].tasks[0] && !appContext?.viewState[viewContext!.viewId].tasks[0]?.invalid && styles.visible,
        )}
      >
        <UKLinearProgressIndicator
          class={styles.progressBar}
          start={0}
          stop={appContext?.viewState[viewContext!.viewId].tasks[0]?.max || 1}
          value={appContext?.viewState[viewContext!.viewId].tasks[0]?.current || 0}
        />
        <UKText role={"label"} size={"m"}>
          {appContext?.viewState[viewContext!.viewId].tasks[0]?.message
            .replaceAll("%c", appContext?.viewState[viewContext!.viewId].tasks[0].current.toString())
            .replaceAll("%m", appContext?.viewState[viewContext!.viewId].tasks[0].max.toString())}
        </UKText>
      </div>
      <UKDivider direction={"vertical"} class={styles.divider} width="full" />
      <div class={styles.sizeControls}>
        <UKText role={"label"} size={"m"}>
          {`${((appContext?.viewState[viewContext!.viewId].zoomPercentage || 1) * 100).toFixed(0)}%`}
        </UKText>
        <UKIconButton
          size="xxs"
          alt="Zoom Out"
          icon={ZOOM_OUT_ICON}
          color="standard"
          onClick={() =>
            appContext?.setViewState(
              viewContext!.viewId,
              "zoomPercentage",
              Number(Math.max(appContext.viewState[viewContext!.viewId].zoomPercentage - 0.2, MIN_ZOOM_VALUE).toFixed(2)),
            )
          }
        />
        <UKIconButton
          size="xxs"
          alt="Reset Zoom"
          icon={VIEW_REAL_SIZE_ICON}
          color={appContext?.viewState[viewContext!.viewId].zoomPercentage === 0 ? "filled" : "standard"}
          onClick={() => appContext?.setViewState(viewContext!.viewId, "zoomPercentage", 1)}
        />
        <UKIconButton
          size="xxs"
          alt="Zoom In"
          icon={ZOOM_IN_ICON}
          color="standard"
          onClick={() =>
            appContext?.setViewState(
              viewContext!.viewId,
              "zoomPercentage",
              Number(Math.min(appContext.viewState[viewContext!.viewId].zoomPercentage + 0.2, MAX_ZOOM_VALUE).toFixed(2)),
            )
          }
        />
      </div>
    </div>
  );
};

export default StatusBar;
