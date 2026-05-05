import type { AppContextType } from "../../App";

export function selectItem(appContext: AppContextType, path: string) {
  appContext?.setViewState("lastSelectedItem", path);
  appContext?.setViewState("selectedItems", [path]);
  appContext.setViewState("lastSelectionTime", Date.now());

  return true;
}

export function deselectAllItems(appContext: AppContextType) {
  appContext?.setViewState("lastSelectedItem", undefined);
  appContext?.setViewState("selectedItems", []);
  appContext.setViewState("lastSelectionTime", -1);

  return true;
}

export function selectNextItem(appContext: AppContextType) {
  const viewItems = appContext?.viewState.viewItems;
  const selectedViewItems = appContext?.viewState.selectedItems;

  if (selectedViewItems?.length === 1) {
    const currentSelectionIndex = viewItems?.findIndex((item) => item.path === selectedViewItems[0]);

    if (currentSelectionIndex === undefined) return false;
    if (!viewItems?.[currentSelectionIndex + 1]) return false;

    appContext?.setViewState("lastSelectedItem", viewItems[currentSelectionIndex + 1].path);
    appContext?.setViewState("selectedItems", [viewItems[currentSelectionIndex + 1].path]);

    return true;
  }

  return false;
}

export function selectPreviousItem(appContext: AppContextType) {
  const viewItems = appContext?.viewState.viewItems;
  const selectedViewItems = appContext?.viewState.selectedItems;

  if (selectedViewItems?.length === 1) {
    const currentSelectionIndex = viewItems?.findIndex((item) => item.path === selectedViewItems[0]);

    if (currentSelectionIndex === undefined) return false;
    if (!viewItems?.[currentSelectionIndex - 1]) return false;

    appContext?.setViewState("lastSelectedItem", viewItems[currentSelectionIndex - 1].path);
    appContext?.setViewState("selectedItems", [viewItems[currentSelectionIndex - 1].path]);

    return true;
  }

  return false;
}
