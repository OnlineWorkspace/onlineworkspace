import type { DOMElement } from "solid-js/jsx-runtime";
import type { AppContextType } from "../../appContext.ts";
import filesystemInterface, { type UniformResourceLocator } from "../../lib/filesystemInterface.ts";
import { deselectAllItems, selectItem } from "./itemSelection.ts";
import type { ViewItem } from "./viewItem.ts";

const onItemClick = (
  e: MouseEvent & { currentTarget: HTMLButtonElement; target: DOMElement },
  appContext: AppContextType,
  itemIndex: number,
  item: ViewItem,
) => {
  const viewId = appContext.globalState.activeViewId;

  if (e.shiftKey && (appContext?.viewState[viewId].selectedItems.length || 0) > 0) {
    // get the index of the selected item, select all items from that index to the current index
    const currentIndex = itemIndex;
    const firstSelectionIndex = appContext?.viewState[viewId].viewItems.findIndex(
      (viewItem) => viewItem.path === appContext.viewState[viewId].selectedItems[0]!,
    );

    if (firstSelectionIndex === undefined) {
      selectItem(appContext, viewId, item.path);
      return;
    }

    if (firstSelectionIndex === currentIndex) {
      deselectAllItems(appContext, viewId);
      return;
    }

    if (firstSelectionIndex > currentIndex) {
      // for all intermediate items, select them
      deselectAllItems(appContext, viewId);

      const newViewSelectedItems: string[] = [];

      for (let i = firstSelectionIndex; i > currentIndex - 1; i--) {
        newViewSelectedItems.push(appContext!.viewState[viewId].viewItems[i].path);
      }

      appContext.setViewState(viewId, "lastSelectedItem", newViewSelectedItems[0]);
      appContext?.setViewState(viewId, "selectedItems", newViewSelectedItems);
      return;
    }

    if (firstSelectionIndex < currentIndex) {
      // for all intermediate items, select them
      deselectAllItems(appContext, viewId);

      const newViewSelectedItems: string[] = [];

      for (let i = firstSelectionIndex; i < currentIndex + 1; i++) {
        newViewSelectedItems.push(appContext!.viewState[viewId].viewItems[i].path);
      }

      appContext.setViewState(viewId, "lastSelectedItem", newViewSelectedItems[0]);
      appContext?.setViewState(viewId, "selectedItems", newViewSelectedItems);

      return;
    }
    alert("Check the console perhaps?");
    console.error("How did we get here?");
  } else if (e.ctrlKey) {
    if (appContext?.viewState[viewId].selectedItems.includes(item.path)) {
      appContext?.setViewState(
        viewId,
        "selectedItems",
        appContext.viewState[viewId].selectedItems.filter((i) => i !== item.path),
      );
    } else {
      appContext?.setViewState(viewId, "selectedItems", [...appContext.viewState[viewId].selectedItems, item.path]);
    }
  } else {
    if (appContext?.viewState[viewId].selectedItems.length === 1 && appContext.viewState[viewId].selectedItems[0] === item.path) {
      if (appContext.viewState[viewId].lastSelectionTime > Date.now() - 500) {
        if (item.type === "file") {
          filesystemInterface.openInDefaultApplication(item.path as UniformResourceLocator);
          return;
        }

        appContext?.setViewState(appContext.globalState.activeViewId, "pathUrl", item.path as UniformResourceLocator);

        return;
      }

      deselectAllItems(appContext, viewId);
      return;
    }

    selectItem(appContext, viewId, item.path);
  }
};

export default onItemClick;
