import UKIcon from "@onlineworkspace/uikit-solid/src/components/icon/UKIcon.tsx";
import UKText from "@onlineworkspace/uikit-solid/src/components/text/UKText.tsx";
import browserPath from "path-browserify";
import { type Component, For, useContext } from "solid-js";
import { AppContext } from "../../../../appContext.ts";
import iconForItemType from "../../iconForItemType.ts";
import onItemClick from "../../itemSelection.ts";
import styles from "./DetailsView.module.scss";

const DetailsView: Component = () => {
  const appContext = useContext(AppContext);

  return (
    <div class={styles.root}>
      <div class={styles.columns}>
        <UKText role={"title"} size={"s"}>
          Name
        </UKText>
        <UKText role={"title"} size={"s"}>
          Date Modified
        </UKText>
        <UKText role={"title"} size={"s"}>
          Time
        </UKText>
        <UKText role={"title"} size={"s"}>
          Size
        </UKText>
      </div>
      <For each={appContext?.viewState.viewItems}>
        {(item, index) => {
          return (
            <button
              type={"button"}
              class={styles.item}
              onClick={(e) => onItemClick(e, appContext!, index(), item)}
              data-selected={appContext?.viewState.selectedItems.includes(item.path)}
            >
              {item.thumbnail !== undefined ? <>thumbnail time</> : <UKIcon>{iconForItemType(item.type)}</UKIcon>}
              {browserPath.basename(item.path)}
            </button>
          );
        }}
      </For>
    </div>
  );
};

export default DetailsView;
