import UKCard from "@onlineworkspace/uikit-solid/src/components/card/UKCard.tsx";
import UKIcon from "@onlineworkspace/uikit-solid/src/components/icon/UKIcon.tsx";
import browserPath from "path-browserify";
import { type Component, For, useContext } from "solid-js";
import { AppContext } from "../../../../appContext.ts";
import iconForItemType from "../../iconForItemType.ts";
import onItemClick from "../../itemSelection.ts";
import styles from "./GridView.module.scss";

const GridView: Component = () => {
  const appContext = useContext(AppContext);

  return (
    <div class={styles.root}>
      <For each={appContext?.viewState.viewItems}>
        {(item, index) => {
          return (
            <UKCard
              class={styles.item}
              onClick={(e) => onItemClick(e, appContext!, index(), item)}
              color={appContext?.viewState.selectedItems.includes(item.path) ? "outlined" : "filled"}
            >
              {item.thumbnail !== undefined ? <>thumbnail time</> : <UKIcon class={styles.thumbnailIcon}>{iconForItemType(item.type)}</UKIcon>}
              {browserPath.basename(item.path)}
            </UKCard>
          );
        }}
      </For>
    </div>
  );
};

export default GridView;
