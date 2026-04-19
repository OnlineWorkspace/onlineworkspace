import LINK_ICON from "@material-symbols/svg-700/outlined/dataset_linked.svg";
import FILE_ICON from "@material-symbols/svg-700/outlined/docs.svg";
import FOLDER_ICON from "@material-symbols/svg-700/outlined/folder.svg";
import UNKNOWN_ICON from "@material-symbols/svg-700/outlined/unknown_document.svg";
import type { ViewItem } from "./viewItem.ts";

export default function iconForItemType(type: ViewItem["type"]) {
  switch (type) {
    case "directory":
      return FOLDER_ICON;
    case "file":
      return FILE_ICON;
    case "link":
      return LINK_ICON;
    default:
      return UNKNOWN_ICON;
  }
}
