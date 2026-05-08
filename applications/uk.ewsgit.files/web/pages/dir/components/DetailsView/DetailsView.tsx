import UKIcon from "@onlineworkspace/uikit-solid/src/components/icon/UKIcon.tsx";
import UKText from "@onlineworkspace/uikit-solid/src/components/text/UKText.tsx";
import clsx from "clsx";
import browserPath from "path-browserify";
import { type Component, For, Show, useContext } from "solid-js";
import type { DOMElement } from "solid-js/jsx-runtime";
import { AppContext } from "../../../../appContext.ts";
import humanReadableSize from "../../../../lib/humanReadableSize.ts";
import iconForItemType from "../../iconForItemType.ts";
import onItemClick from "../../itemClick.ts";
import { ViewContext } from "../../viewContext.ts";
import styles from "./DetailsView.module.scss";

const DetailsView: Component = () => {
  const appContext = useContext(AppContext);
  const viewContext = useContext(ViewContext);

  return (
    <Show when={(appContext?.viewState[viewContext!.viewId].viewItems.length || 0) > 0}>
      <table class={styles.root} style={{ "--zoom-percentage": appContext?.viewState[viewContext!.viewId].zoomPercentage }}>
        <thead>
          <tr class={styles.columns}>
            <th scope="col"></th>
            <th scope="col" style={{ "max-width": "48rem", width: "100%" }}>
              <UKText role={"title"} size={"s"}>
                Name
              </UKText>
            </th>
            <th scope="col" style={{ width: "8rem" }}>
              <UKText role={"title"} size={"s"}>
                Modified
              </UKText>
            </th>
            <th scope="col" style={{ width: "8rem" }}>
              <UKText role={"title"} size={"s"}>
                Created
              </UKText>
            </th>
            <th scope="col" style={{ width: "8rem" }}>
              <UKText role={"title"} size={"s"}>
                Size
              </UKText>
            </th>
          </tr>
        </thead>
        <tbody>
          <For each={appContext?.viewState[viewContext!.viewId].viewItems}>
            {(item, index) => {
              if (!appContext?.userPreferences.showHidden && item.hidden) return null;

              let modifiedAtString = new Date(item.modifiedAt || 0).toLocaleString();
              const createdAtString = new Date(item.createdAt || 0).toLocaleString();

              if (modifiedAtString === createdAtString) {
                modifiedAtString = "-";
              }

              return (
                <tr
                  tabIndex={0}
                  data-fs-item-path={item.path}
                  class={clsx(styles.item, item.hidden && styles.itemHidden)}
                  onClick={(e) => {
                    e.stopPropagation();
                    onItemClick(e as unknown as MouseEvent & { currentTarget: HTMLButtonElement; target: DOMElement }, appContext!, index(), item);
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDblClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  data-selected={appContext?.viewState[viewContext!.viewId].selectedItems.includes(item.path)}
                >
                  <td>
                    {item.thumbnail !== undefined ? (
                      <img class={styles.itemThumbnail} alt="" src={item.thumbnail} loading="lazy" />
                    ) : (
                      <UKIcon class={styles.itemIcon}>{iconForItemType(item.type)}</UKIcon>
                    )}
                  </td>
                  <td>
                    {appContext?.viewState[viewContext!.viewId].isRenaming === item.path ? (
                      <div>Hello Renaming World!</div>
                    ) : (
                      <UKText size="m" role="body">
                        {browserPath.basename(item.path)}
                      </UKText>
                    )}
                  </td>
                  <td>
                    <UKText size="m" role="body">
                      {modifiedAtString}
                    </UKText>
                  </td>
                  <td>
                    <UKText size="m" role="body">
                      {createdAtString}
                    </UKText>
                  </td>
                  <td>
                    <UKText size="m" role="body">
                      {humanReadableSize(item.size || 0)}
                    </UKText>
                  </td>
                </tr>
              );
            }}
          </For>
        </tbody>
      </table>
    </Show>
  );
};

export default DetailsView;
