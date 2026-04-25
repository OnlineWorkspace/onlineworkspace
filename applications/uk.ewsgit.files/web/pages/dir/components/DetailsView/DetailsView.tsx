import UKIcon from "@onlineworkspace/uikit-solid/src/components/icon/UKIcon.tsx";
import UKText from "@onlineworkspace/uikit-solid/src/components/text/UKText.tsx";
import browserPath from "path-browserify";
import {type Component, For, useContext} from "solid-js";
import {AppContext} from "../../../../appContext.ts";
import iconForItemType from "../../iconForItemType.ts";
import onItemClick from "../../itemClick.ts";
import styles from "./DetailsView.module.scss";
import type {DOMElement} from "solid-js/jsx-runtime";
import {useSearchParams} from "@solidjs/router";
import humanReadableSize from "../../../../lib/humanReadableSize.ts";
import clsx from "clsx";

const DetailsView: Component = () => {
  const [ _, setSearchParams ] = useSearchParams();
  const appContext = useContext(AppContext);

  return (
    <table class={styles.root}>
      <thead>
        <tr class={styles.columns}>
          <th scope="col"></th>
          <th scope="col">
            <UKText role={"title"} size={"s"}>
              Name
            </UKText>
          </th>
          <th scope="col">
            <UKText role={"title"} size={"s"}>
              Modified
            </UKText>
          </th>
          <th scope="col">
            <UKText role={"title"} size={"s"}>
              Created
            </UKText>
          </th>
          <th scope="col">
            <UKText role={"title"} size={"s"}>
              Size
            </UKText>
          </th>
        </tr>
      </thead>
      <tbody>
        <For each={appContext?.viewState.viewItems}>
          {(item, index) => {
            if (!appContext?.userPreferences.showHidden && item.hidden) return null;

            let modifiedAtString = (new Date(item.modifiedAt || 0)).toLocaleString()
            const createdAtString = (new Date(item.createdAt || 0)).toLocaleString()

            if (modifiedAtString === createdAtString) {
              modifiedAtString = "-"
            }

            return (
              <tr
                data-fs-item-path={item.path}
                class={clsx(styles.item, item.hidden && styles.itemHidden)}
                onClick={(e) => {
                  e.stopPropagation();
                  onItemClick(e as unknown as MouseEvent & {currentTarget: HTMLButtonElement; target: DOMElement}, appContext!, index(), item, setSearchParams)
                }}
                onMouseDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                onDblClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                data-selected={appContext?.viewState.selectedItems.includes(item.path)}
              >
                <td>{item.thumbnail !== undefined ? <img class={styles.itemThumbnail} alt="" src={item.thumbnail} loading="lazy" /> : <UKIcon class={styles.itemIcon}>{iconForItemType(item.type)}</UKIcon>}</td>
                <td>
                  <UKText size="m" role="body">
                    {browserPath.basename(item.path)}
                  </UKText>
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
  );
};

export default DetailsView;
