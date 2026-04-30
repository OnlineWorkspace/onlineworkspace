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

const GridView: Component = () => {
  const [ _, setSearchParams ] = useSearchParams();
  const appContext = useContext(AppContext);

  return (
    <div class={styles.root}>
      <For each={appContext?.viewState.viewItems}>
        {(item, index) => {
          if (!appContext?.userPreferences.showHidden && item.hidden) return null;

          return (
            <UKCard
              class={clsx(styles.item, item.hidden && styles.itemHidden)}
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
              color={appContext?.viewState.selectedItems.includes(item.path) ? "outlined" : "filled"}
            >
              {item.thumbnail !== undefined ? (
                <img class={styles.itemThumbnail} alt="" src={item.thumbnail} loading="lazy" />
              ) : (
                <UKIcon class={styles.thumbnailIcon}>{iconForItemType(item.type)}</UKIcon>
              )}
              {browserPath.basename(item.path)}
            </UKCard>
          );
        }}
      </For>
    </div>
  );
};

export default GridView;
