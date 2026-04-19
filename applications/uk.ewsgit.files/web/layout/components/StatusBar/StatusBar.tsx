import UKLinearProgressIndicator from "@onlineworkspace/uikit-solid/src/components/linearProgressIndicator/UKLinearProgressIndicator.tsx";
import UKText from "@onlineworkspace/uikit-solid/src/components/text/UKText.tsx";
import { type Component, createEffect, createSignal, onCleanup, onMount, useContext } from "solid-js";
import { AppContext } from "../../../appContext.ts";
import humanReadableSize from "../../../lib/humanReadableSize.ts";
import styles from "./StatusBar.module.scss";

const StatusBar: Component = () => {
  const appContext = useContext(AppContext);
  const [statusProgression, setStatusProgression] = createSignal(0);
  const [dirContents, setDirContents] = createSignal<string>("");

  onMount(() => {
    const interval = setInterval(() => {
      setStatusProgression((u) => {
        if (u + 10 > 100) {
          return 0;
        } else {
          return u + 10;
        }
      });
    }, 500);

    onCleanup(() => {
      clearInterval(interval);
    });
  });

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

    setDirContents(outputString);
  });

  return (
    <div class={styles.root}>
      <UKText role={"label"} size={"m"}>
        {dirContents()}
      </UKText>
      <div class={styles.margin}></div>
      <UKLinearProgressIndicator class={styles.progressBar} start={0} stop={100} value={statusProgression()} />
      <UKText role={"label"} size={"m"}>
        Status Message
      </UKText>
    </div>
  );
};

export default StatusBar;
