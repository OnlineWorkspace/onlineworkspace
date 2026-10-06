import STACKS_ICON from "@material-symbols/svg-700/outlined/stacks.svg";
import UKIcon from "@ewsgit/uikit-solid/src/components/icon/UKIcon.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import { type Component, Show } from "solid-js";
import { pluralise } from "../lib/format";
import { thumbnailSize, thumbnailUrl } from "../lib/media";
import type { AlbumSummary } from "../lib/types";
import styles from "./AlbumCard.module.scss";

const AlbumCard: Component<{ album: AlbumSummary; onClick: () => void }> = (props) => {
  return (
    <button type="button" class={styles.root} onClick={props.onClick}>
      <div class={styles.cover}>
        <Show when={props.album.cover} fallback={<UKIcon class={styles.placeholder}>{STACKS_ICON}</UKIcon>}>
          {(cover) => <img src={thumbnailUrl(cover().id, cover().version, thumbnailSize(320))} alt="" loading="lazy" decoding="async" draggable={false} />}
        </Show>
      </div>
      <div class={styles.text}>
        <UKText role="title" size="m" emphasized class={styles.name}>
          {props.album.name}
        </UKText>
        <UKText role="body" size="m" class={styles.count}>
          {pluralise(props.album.count, "item")}
        </UKText>
      </div>
    </button>
  );
};

export default AlbumCard;
