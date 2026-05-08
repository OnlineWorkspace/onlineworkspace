import UKIcon from "@onlineworkspace/uikit-solid/src/components/icon/UKIcon.tsx";
import UKText from "@onlineworkspace/uikit-solid/src/components/text/UKText.jsx";
import clsx from "clsx";
import browserPath from "path-browserify";
import { type Component, For, useContext } from "solid-js";
import { AppContext } from "../../../../appContext.ts";
import iconForItemType from "../../iconForItemType.ts";
import onItemClick from "../../itemClick.ts";
import { ViewContext } from "../../viewContext.ts";
import styles from "./GridView.module.scss";

const GridView: Component = () => {
  const appContext = useContext(AppContext);
  const viewContext = useContext(ViewContext);

  return (
    <div class={styles.root} style={{ "--zoom-percentage": appContext?.userPreferences.zoomPercentage }}>
      <For each={appContext?.viewState[viewContext!.viewId].viewItems}>
        {(item, index) => {
          if (!appContext?.userPreferences.showHidden && item.hidden) return null;

          return (
            <button
              type="button"
              class={clsx(
                styles.item,
                item.hidden && styles.itemHidden,
                appContext!.viewState[viewContext!.viewId].selectedItems.includes(item.path) && styles.selected,
              )}
              data-fs-item-path={item.path}
              onClick={(e) => onItemClick(e, appContext!, index(), item)}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDblClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              {item.thumbnail !== undefined ? (
                <img class={styles.itemThumbnail} alt="" src={item.thumbnail} loading="lazy" />
              ) : (
                <UKIcon class={styles.thumbnailIcon}>{iconForItemType(item.type)}</UKIcon>
              )}
              <UKText size="m" role="label" align="center" class={styles.itemLabel}>
                {browserPath.basename(item.path)}
              </UKText>
            </button>
          );
        }}
      </For>
    </div>
  );
};

export default GridView;
