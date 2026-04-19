import UKCard from "@onlineworkspace/uikit-solid/src/components/card/UKCard.tsx";
import { type Component, For, useContext } from "solid-js";
import { AppContext } from "../../../../appContext.ts";
import styles from "./GridView.module.scss";

const GridView: Component = () => {
  const appContext = useContext(AppContext);

  return (
    <div class={styles.root}>
      <For each={appContext?.viewState.viewItems}>
        {(item, index) => {
          return (
            <UKCard
              onClick={(e) => {
                if (e.shiftKey && (appContext?.viewState.selectedItems.length || 0) > 0) {
                  // get the index of the selected item, select all items from that index to the current index
                  const currentIndex = index();
                  const firstSelectionIndex = appContext?.viewState.viewItems.findIndex((viewItem) => viewItem.path === appContext.viewState.selectedItems[0]!);

                  if (!firstSelectionIndex) {
                    appContext?.setViewState("selectedItems", [item.path]);
                    return;
                  }

                  if (firstSelectionIndex === currentIndex) {
                    appContext?.setViewState("selectedItems", []);
                    return;
                  }

                  if (firstSelectionIndex > currentIndex) {
                    // for all intermediate items, select them
                    appContext?.setViewState("selectedItems", []);

                    const newViewSelectedItems: string[] = [];

                    for (let i = firstSelectionIndex; i > currentIndex - 1; i--) {
                      newViewSelectedItems.push(appContext!.viewState.viewItems[i].path);
                    }

                    appContext?.setViewState("selectedItems", newViewSelectedItems);
                    return;
                  }

                  if (firstSelectionIndex < currentIndex) {
                    // for all intermediate items, select them
                    appContext?.setViewState("selectedItems", []);

                    const newViewSelectedItems: string[] = [];

                    for (let i = currentIndex; i > firstSelectionIndex - 1; i--) {
                      newViewSelectedItems.push(appContext!.viewState.viewItems[i].path);
                    }

                    appContext?.setViewState("selectedItems", newViewSelectedItems);

                    return;
                  }
                  alert("Check the console perhaps?");
                  console.error("How did we get here?");
                } else if (e.ctrlKey) {
                  if (appContext?.viewState.selectedItems.includes(item.path)) {
                    appContext?.setViewState(
                      "selectedItems",
                      appContext.viewState.selectedItems.filter((i) => i !== item.path),
                    );
                  } else {
                    appContext?.setViewState("selectedItems", [...appContext.viewState.selectedItems, item.path]);
                  }
                } else {
                  if (appContext?.viewState.selectedItems.length === 1 && appContext.viewState.selectedItems[0] === item.path) {
                    // Open the item!
                    alert("Open this item!");
                    return;
                  }
                  appContext?.setViewState("selectedItems", [item.path]);
                }
              }}
              color={appContext?.viewState.selectedItems.includes(item.path) ? "outlined" : "filled"}
            >
              {item.thumbnail}
              {item.path}
            </UKCard>
          );
        }}
      </For>
    </div>
  );
};

export default GridView;
