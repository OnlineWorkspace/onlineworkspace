import type { DOMElement } from "solid-js/jsx-runtime";
import type { AppContextType } from "../../appContext.ts";
import filesystemInterface, { type UniformResourceLocator } from "../../lib/filesystemInterface.ts";
import { deselectAllItems, selectItem } from "./itemSelection.ts";
import type { ViewContextType } from "./viewContext.ts";
import type { ViewItem } from "./viewItem.ts";

const onItemClick = (
  e: MouseEvent & { currentTarget: HTMLButtonElement; target: DOMElement },
  appContext: AppContextType,
  viewContext: ViewContextType,
  itemIndex: number,
  item: ViewItem,
  setSearchParams: (params: { [key: string]: string }) => void,
) => {
  if (e.shiftKey && (viewContext?.viewState.selectedItems.length || 0) > 0) {
    // get the index of the selected item, select all items from that index to the current index
    const currentIndex = itemIndex;
    const firstSelectionIndex = viewContext?.viewState.viewItems.findIndex((viewItem) => viewItem.path === viewContext.viewState.selectedItems[0]!);

    if (firstSelectionIndex === undefined) {
      selectItem(viewContext, item.path);
      return;
    }

    if (firstSelectionIndex === currentIndex) {
      deselectAllItems(appContext, viewContext);
      return;
    }

    if (firstSelectionIndex > currentIndex) {
      // for all intermediate items, select them
      deselectAllItems(appContext, viewContext);

      const newViewSelectedItems: string[] = [];

      for (let i = firstSelectionIndex; i > currentIndex - 1; i--) {
        newViewSelectedItems.push(viewContext!.viewState.viewItems[i].path);
      }

      viewContext.setViewState("lastSelectedItem", newViewSelectedItems[0]);
      viewContext?.setViewState("selectedItems", newViewSelectedItems);
      return;
    }

    if (firstSelectionIndex < currentIndex) {
      // for all intermediate items, select them
      deselectAllItems(appContext, viewContext);

      const newViewSelectedItems: string[] = [];

      for (let i = firstSelectionIndex; i < currentIndex + 1; i++) {
        newViewSelectedItems.push(viewContext!.viewState.viewItems[i].path);
      }

      viewContext.setViewState("lastSelectedItem", newViewSelectedItems[0]);
      viewContext?.setViewState("selectedItems", newViewSelectedItems);

      return;
    }
    alert("Check the console perhaps?");
    console.error("How did we get here?");
  } else if (e.ctrlKey) {
    if (viewContext?.viewState.selectedItems.includes(item.path)) {
      viewContext?.setViewState(
        "selectedItems",
        viewContext.viewState.selectedItems.filter((i) => i !== item.path),
      );
    } else {
      viewContext?.setViewState("selectedItems", [...viewContext.viewState.selectedItems, item.path]);
    }
  } else {
    if (viewContext?.viewState.selectedItems.length === 1 && viewContext.viewState.selectedItems[0] === item.path) {
      if (viewContext.viewState.lastSelectionTime > Date.now() - 500) {
        if (item.type === "file") {
          filesystemInterface.openInDefaultApplication(item.path as UniformResourceLocator);
          return;
        }

        setSearchParams({ path: item.path });

        return;
      }

      deselectAllItems(appContext, viewContext);
      return;
    }

    selectItem(viewContext, item.path);
  }
};

export default onItemClick;
