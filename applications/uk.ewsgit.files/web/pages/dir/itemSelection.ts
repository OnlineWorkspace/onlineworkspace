import type { DOMElement } from "solid-js/jsx-runtime";
import type { AppContextType } from "../../App.tsx";
import type { ViewItem } from "./viewItem.ts";

const onItemClick = (
  e: MouseEvent & { currentTarget: HTMLButtonElement; target: DOMElement },
  appContext: AppContextType,
  itemIndex: number,
  item: ViewItem,
) => {
  if (e.shiftKey && (appContext?.viewState.selectedItems.length || 0) > 0) {
    // get the index of the selected item, select all items from that index to the current index
    const currentIndex = itemIndex;
    const firstSelectionIndex = appContext?.viewState.viewItems.findIndex((viewItem) => viewItem.path === appContext.viewState.selectedItems[0]!);

    if (firstSelectionIndex === undefined) {
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

      for (let i = firstSelectionIndex; i < currentIndex + 1; i++) {
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
      if (appContext.viewState.lastSelectionTime > Date.now() - 500) {
        // Open the item!
        alert("Open this item!");
        return;
      }

      appContext?.setViewState("selectedItems", []);
      appContext.setViewState("lastSelectionTime", -1);
      return;
    }
    appContext?.setViewState("selectedItems", [item.path]);
    appContext.setViewState("lastSelectionTime", Date.now());
  }
};
export default onItemClick;
