import UKDivider from "@onlineworkspace/uikit-solid/src/components/divider/UKDivider.tsx";
import UKIcon from "@onlineworkspace/uikit-solid/src/components/icon/UKIcon.tsx";
import UKText from "@onlineworkspace/uikit-solid/src/components/text/UKText.tsx";
import useIsMobile from "@onlineworkspace/uikit-solid/src/core/useIsMobile.ts";
import browserPath from "path-browserify";
import { type Component, useContext } from "solid-js";
import { AppContext } from "../../../appContext.ts";
import humanReadableSize from "../../../lib/humanReadableSize.ts";
import iconForItemType from "../../../pages/dir/iconForItemType.ts";
import styles from "./PreviewPane.module.scss";

const PreviewPane: Component = () => {
  const isMobile = useIsMobile();
  const appContext = useContext(AppContext);

  return (
    <div class={styles.root} data-hide={!appContext?.userPreferences.showPreview || isMobile()}>
      {/* <UKText role={"title"} size={"m"}>
        Preview
      </UKText>
      <UKDivider direction={"horizontal"} />
      {!isMobile() && appContext?.userPreferences.showPreview && (appContext?.viewState.selectedItems.length || 0) > 0 ? (
        <>
          {appContext!.viewState.selectedItems.length > 1 ? (
            <>
              <UKIcon class={styles.previewIcon}>{iconForItemType("unknown")}</UKIcon>
              <UKText class={styles.previewItemName} role="body" size="l" align={"center"}>
                {appContext!.viewState.selectedItems.length} items
              </UKText>
              <UKText class={styles.previewItemName} role="body" size="s" align={"center"}>
                ({humanReadableSize(appContext.viewState.viewItems.filter(i => appContext.viewState.selectedItems.includes(i.path)).map(i => i?.size || 0).reduce((accumulator, currentValue) => accumulator + currentValue, 0))})
              </UKText>
            </>
          ) : (
            <>
              <UKIcon class={styles.previewIcon}>
                {iconForItemType(
                  appContext?.viewState.viewItems.find((item) => {
                    return item.path === appContext!.viewState.selectedItems[ 0 ];
                  })?.type || "file",
                )}
              </UKIcon>
              <UKText class={styles.previewItemName} role="body" size="l" align={"center"}>
                {browserPath.basename(appContext!.viewState.selectedItems[ 0 ])}
              </UKText>
              <UKText class={styles.previewItemName} role="body" size="s" align={"center"}>
                ({humanReadableSize(appContext.viewState.viewItems.find(i => i.path === appContext.viewState.selectedItems[ 0 ])?.size || 0)})
              </UKText>
            </>
          )}
          <UKText role={"title"} size={"m"}>
            Details
          </UKText>
          <UKDivider direction={"horizontal"} />
          <UKText role={"body"} size={"m"}>
            Dimensions: ...x...
          </UKText>
        </>
      ) : null} */}
    </div>
  );
};

export default PreviewPane;
