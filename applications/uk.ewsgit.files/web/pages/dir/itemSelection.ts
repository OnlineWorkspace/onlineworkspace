import type { AppContextType } from "../../appContext";
import type { ViewContextType } from "./viewContext";

export function selectItem(viewContext: ViewContextType, path: string) {
  viewContext?.setViewState("lastSelectedItem", path);
  viewContext?.setViewState("selectedItems", [path]);
  viewContext.setViewState("lastSelectionTime", Date.now());

  return true;
}

export function deselectAllItems(appContext: AppContextType, viewContext: ViewContextType) {
  viewContext.setViewState("lastSelectedItem", undefined);
  viewContext.setViewState("selectedItems", []);
  viewContext.setViewState("lastSelectionTime", -1);
  appContext.setGlobalState("showPreview", false);

  return true;
}

export function selectNextItem(viewContext: ViewContextType) {
  const viewItems = viewContext?.viewState.viewItems;
  const selectedViewItems = viewContext?.viewState.selectedItems;

  if (selectedViewItems?.length === 1) {
    const currentSelectionIndex = viewItems?.findIndex((item) => item.path === selectedViewItems[0]);

    if (currentSelectionIndex === undefined) return false;
    if (!viewItems?.[currentSelectionIndex + 1]) return false;

    viewContext?.setViewState("lastSelectedItem", viewItems[currentSelectionIndex + 1].path);
    viewContext?.setViewState("selectedItems", [viewItems[currentSelectionIndex + 1].path]);

    return true;
  }

  return false;
}

export function selectPreviousItem(viewContext: ViewContextType) {
  const viewItems = viewContext?.viewState.viewItems;
  const selectedViewItems = viewContext?.viewState.selectedItems;

  if (selectedViewItems?.length === 1) {
    const currentSelectionIndex = viewItems?.findIndex((item) => item.path === selectedViewItems[0]);

    if (currentSelectionIndex === undefined) return false;
    if (!viewItems?.[currentSelectionIndex - 1]) return false;

    viewContext?.setViewState("lastSelectedItem", viewItems[currentSelectionIndex - 1].path);
    viewContext?.setViewState("selectedItems", [viewItems[currentSelectionIndex - 1].path]);

    return true;
  }

  return false;
}
