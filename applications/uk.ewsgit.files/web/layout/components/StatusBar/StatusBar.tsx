import UKLinearProgressIndicator from "@onlineworkspace/uikit-solid/src/components/linearProgressIndicator/UKLinearProgressIndicator.tsx";
import UKText from "@onlineworkspace/uikit-solid/src/components/text/UKText.tsx";
import {type Component, createEffect, createSignal, onCleanup, onMount, useContext} from "solid-js";
import {AppContext} from "../../../appContext.ts";
import humanReadableSize from "../../../lib/humanReadableSize.ts";
import styles from "./StatusBar.module.scss";
import clsx from "clsx";

const StatusBar: Component = () => {
  const appContext = useContext(AppContext);
  const [ dirContents, setDirContents ] = createSignal<string>("");

  createEffect(() => {
    const viewItems = appContext?.viewState.viewItems;

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

    const selectedItems = appContext?.viewState.selectedItems || [];

    if (selectedItems?.length > 0) {
      outputString += ` - Selected ${selectedItems.length} item${selectedItems.length !== 1 ? "s" : ""}`;
    }

    if (outputString === "") {
      outputString = "Empty directory"
    }

    setDirContents(outputString);
  });

  createEffect(() => {
    for (const task of appContext?.tasks() || []) {
      if (task.current === task.max) {
        setTimeout(() => {
          appContext?.setTasks(tasks => tasks.map(t => {
            if (t.id === task.id) {
              return {
                ...t,
                invalid: true
              }
            }

            return t
          }))

          setTimeout(() => {
            appContext?.setTasks(tasks => tasks.filter(t => t.id !== task.id))
          }, 250)
        }, 1000)
      }
    }
  })

  return (
    <div class={styles.root}>
      <UKText role={"label"} size={"m"}>
        {dirContents()}
      </UKText>
      <div class={styles.margin}></div>
      <div class={clsx(styles.taskStatus, appContext!.tasks()[ 0 ] && !(appContext!.tasks()[ 0 ]?.invalid) && styles.visible)}>
        <UKLinearProgressIndicator class={styles.progressBar} start={0} stop={appContext!.tasks()[ 0 ]?.max || 1} value={appContext!.tasks()[ 0 ]?.current || 0} />
        <UKText role={"label"} size={"m"}>
          {appContext!.tasks()[ 0 ]?.message.replaceAll("%c", appContext!.tasks()[ 0 ].current.toString()).replaceAll("%m", appContext!.tasks()[ 0 ].max.toString())}
        </UKText>
      </div>
    </div>
  );
};

export default StatusBar;
