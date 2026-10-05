import MORE_VERT_ICON from "@material-symbols/svg-700/outlined/more_vert.svg";
import UKIconButton from "@ewsgit/uikit-solid/src/components/iconButton/UKIconButton.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import type { Component } from "solid-js";
import { useFiles } from "../lib/context";
import { formatBytes, formatModified } from "../lib/format";
import type { Entry } from "../lib/types";
import Thumbnail from "./Thumbnail";
import styles from "./EntryRow.module.scss";

/** A simple tappable row (badge, name, "Today · 4.2 MB", kebab) for the short lists on the home page. */
const EntryRow: Component<{ entry: Entry }> = (props) => {
  const { actions } = useFiles();

  return (
    <div class={styles.root} role="button" tabindex="0" onClick={() => actions.open(props.entry)} onKeyDown={(event) => event.key === "Enter" && actions.open(props.entry)}>
      <Thumbnail entry={props.entry} size="s" pixels={36} />
      <div class={styles.text}>
        <UKText role="body" size="l" class={styles.ellipsis}>
          {props.entry.name}
        </UKText>
        <UKText role="body" size="m" class={styles.subtitle}>
          {formatModified(props.entry.modified)} · {formatBytes(props.entry.size)}
        </UKText>
      </div>
      <UKIconButton
        color="standard"
        icon={MORE_VERT_ICON}
        alt={`More actions for ${props.entry.name}`}
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          actions.openEntryMenu([props.entry], rect.left - 200, rect.bottom);
        }}
      />
    </div>
  );
};

export default EntryRow;
