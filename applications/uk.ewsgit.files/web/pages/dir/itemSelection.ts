import type { AppContextType } from "../../appContext";

export function selectItem(appContext: AppContextType, viewId: number, path: string) {
  appContext.setViewState(viewId, "lastSelectedItem", path);
  appContext.setViewState(viewId, "selectedItems", [path]);
  appContext.setViewState(viewId, "lastSelectionTime", Date.now());

  return true;
}

export function deselectAllItems(appContext: AppContextType, viewId: number) {
  appContext.setViewState(viewId, "lastSelectedItem", undefined);
  appContext.setViewState(viewId, "selectedItems", []);
  appContext.setViewState(viewId, "lastSelectionTime", -1);
  appContext.setGlobalState("showPreview", false);

  for (const key of Object.keys(appContext.viewState)) {
    appContext.setViewState(Number(key), "selectedItems", []);
  }

  return true;
}

export function selectNextItem(appContext: AppContextType, viewId: number) {
  const viewItems = appContext.viewState[viewId]?.viewItems;
  const selectedViewItems = appContext.viewState[viewId]?.selectedItems;

  if (selectedViewItems?.length === 1) {
    const currentSelectionIndex = viewItems?.findIndex((item) => item.path === selectedViewItems[0]);

    if (currentSelectionIndex === undefined) return false;
    if (!viewItems?.[currentSelectionIndex + 1]) return false;

    appContext.setViewState(viewId, "lastSelectedItem", viewItems[currentSelectionIndex + 1].path);
    appContext.setViewState(viewId, "selectedItems", [viewItems[currentSelectionIndex + 1].path]);

    return true;
  }

  return false;
}

export function selectPreviousItem(appContext: AppContextType, viewId: number) {
  const viewItems = appContext.viewState[viewId]?.viewItems;
  const selectedViewItems = appContext.viewState[viewId]?.selectedItems;

  if (selectedViewItems?.length === 1) {
    const currentSelectionIndex = viewItems?.findIndex((item) => item.path === selectedViewItems[0]);

    if (currentSelectionIndex === undefined) return false;
    if (!viewItems?.[currentSelectionIndex - 1]) return false;

    appContext.setViewState(viewId, "lastSelectedItem", viewItems[currentSelectionIndex - 1].path);
    appContext.setViewState(viewId, "selectedItems", [viewItems[currentSelectionIndex - 1].path]);

    return true;
  }

  return false;
}
