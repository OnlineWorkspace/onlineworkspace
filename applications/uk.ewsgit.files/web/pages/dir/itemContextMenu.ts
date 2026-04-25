import type { MenuItem } from "@onlineworkspace/uikit-solid/src/components/menu/UKMenu.jsx";
import type { AppContextType } from "../../App";
import type { ViewItem } from "./viewItem";

const itemContextMenu = (appContext: AppContextType, itemIndex: number, item: ViewItem): (MenuItem | undefined)[] => {
  return [];
};
