import UKIcon from "@onlineworkspace/uikit-solid/src/components/icon/UKIcon.tsx";
import UKText from "@onlineworkspace/uikit-solid/src/components/text/UKText.tsx";
import browserPath from "path-browserify";
import { type Component, For, useContext } from "solid-js";
import { AppContext } from "../../../../appContext.ts";
import iconForItemType from "../../iconForItemType.ts";
import onItemClick from "../../itemSelection.ts";
import styles from "./DetailsView.module.scss";
import type { DOMElement } from "solid-js/jsx-runtime";

const DetailsView: Component = () => {
  const appContext = useContext(AppContext);

  return (
    <>
      {appContext?.viewState.viewItems.length === 0 ? (
        <div class={styles.noFiles}>You have no files</div>
      ) : (
        <table class={styles.root}>
          <tbody>
            <tr class={styles.columns}>
              <th></th>
              <th>
                <UKText role={"title"} size={"s"}>
                  Name
                </UKText>
              </th>
              <th>
                <UKText role={"title"} size={"s"}>
                  Date Modified
                </UKText>
              </th>
              <th>
                <UKText role={"title"} size={"s"}>
                  Time Modified
                </UKText>
              </th>
              <th>
                <UKText role={"title"} size={"s"}>
                  Size
                </UKText>
              </th>
            </tr>
            <For each={appContext?.viewState.viewItems}>
              {(item, index) => {
                return (
                  <tr
                    data-fs-item-path={item.path}
                    class={styles.item}
                    onClick={(e) =>
                      onItemClick(e as unknown as MouseEvent & { currentTarget: HTMLButtonElement; target: DOMElement }, appContext!, index(), item)
                    }
                    data-selected={appContext?.viewState.selectedItems.includes(item.path)}
                  >
                    <td>{item.thumbnail !== undefined ? <>thumbnail time</> : <UKIcon class={styles.itemIcon}>{iconForItemType(item.type)}</UKIcon>}</td>
                    <td>
                      <UKText size="m" role="body">
                        {browserPath.basename(item.path)}
                      </UKText>
                    </td>
                    <td>
                      <UKText size="m" role="body">
                        1/1/1970
                      </UKText>
                    </td>
                    <td>
                      <UKText size="m" role="body">
                        00:23
                      </UKText>
                    </td>
                    <td>
                      <UKText size="m" role="body">
                        100 Bytes
                      </UKText>
                    </td>
                  </tr>
                );
              }}
            </For>
          </tbody>
        </table>
      )}
    </>
  );
};

export default DetailsView;
