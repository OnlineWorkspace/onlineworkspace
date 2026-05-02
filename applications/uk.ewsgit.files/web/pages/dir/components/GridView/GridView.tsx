import UKCard from "@onlineworkspace/uikit-solid/src/components/card/UKCard.tsx";
import UKIcon from "@onlineworkspace/uikit-solid/src/components/icon/UKIcon.tsx";
import {useSearchParams} from "@solidjs/router";
import clsx from "clsx";
import browserPath from "path-browserify";
import {type Component, For, useContext} from "solid-js";
import {AppContext} from "../../../../appContext.ts";
import iconForItemType from "../../iconForItemType.ts";
import onItemClick from "../../itemClick.ts";
import styles from "./GridView.module.scss";
import UKText from "@onlineworkspace/uikit-solid/src/components/text/UKText.jsx";

const GridView: Component = () => {
  const [ _, setSearchParams ] = useSearchParams();
  const appContext = useContext(AppContext);

  return (
    <div class={styles.root} style={{"--zoom-percentage": appContext?.userPreferences.zoomPercentage}}>
      <For each={appContext?.viewState.viewItems}>
        {(item, index) => {
          if (!appContext?.userPreferences.showHidden && item.hidden) return null;

          return (
            <button
              type="button"
              class={clsx(styles.item, item.hidden && styles.itemHidden, appContext?.viewState.selectedItems.includes(item.path) && styles.selected)}
              data-fs-item-path={item.path}
              onClick={(e) => onItemClick(e, appContext!, index(), item, setSearchParams)}
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
