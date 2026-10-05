import FOLDER_ICON from "@material-symbols/svg-700/outlined/folder.svg";
import UKIcon from "@ewsgit/uikit-solid/src/components/icon/UKIcon.tsx";
import clsx from "clsx";
import type { Component } from "solid-js";
import type { Entry } from "../lib/types";
import styles from "./FileBadge.module.scss";

/** The coloured tile that stands in for a file's icon: "PDF", "ZIP", "PNG"… or a folder glyph. */
const FileBadge: Component<{
  entry: Pick<Entry, "kind" | "category" | "extension">;
  size?: "s" | "m" | "l";
  class?: string;
}> = (props) => {
  return (
    <div class={clsx(styles.root, props.class)} data-category={props.entry.category} data-size={props.size ?? "m"} aria-hidden="true">
      {props.entry.kind === "directory" ? <UKIcon class={styles.folder}>{FOLDER_ICON}</UKIcon> : <span>{(props.entry.extension || "file").slice(0, 4).toUpperCase()}</span>}
    </div>
  );
};

export default FileBadge;
