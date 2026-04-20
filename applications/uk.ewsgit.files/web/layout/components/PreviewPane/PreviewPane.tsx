import UKDivider from "@onlineworkspace/uikit-solid/src/components/divider/UKDivider.tsx";
import UKText from "@onlineworkspace/uikit-solid/src/components/text/UKText.tsx";
import { type Component, useContext } from "solid-js";
import { AppContext } from "../../../appContext.ts";
import styles from "./PreviewPane.module.scss";
import browserPath from "path-browserify";

const PreviewPane: Component = () => {
  const appContext = useContext(AppContext);

  return (
    <div class={styles.root}>
      <UKText role={"title"} size={"m"}>
        Preview
      </UKText>
      <UKDivider direction={"horizontal"} />
      {(appContext?.viewState.selectedItems.length || 0) > 0 ? (
        appContext!.viewState.selectedItems.length > 1 ? (
          <>
            <div></div>
            <UKText role="body" size="l">
              {appContext!.viewState.selectedItems.length} items
            </UKText>
          </>
        ) : (
          <>
            <div></div>
            <UKText role="body" size="l">
              {browserPath.basename(appContext!.viewState.selectedItems[0])}
            </UKText>
          </>
        )
      ) : null}
    </div>
  );
};

export default PreviewPane;
