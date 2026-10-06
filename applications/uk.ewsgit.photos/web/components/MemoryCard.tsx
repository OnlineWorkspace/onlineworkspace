import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import { type Component } from "solid-js";
import { memoryAge, memoryMonth } from "../lib/format";
import { thumbnailSize, thumbnailUrl } from "../lib/media";
import styles from "./MemoryCard.module.scss";

export interface MemorySummary {
  id: string;
  count: number;
  place: string | null;
  cover: { id: number; version: number };
}

/** A past month shown as a card: a photo from it, what it was ("Lisbon" or "March 2024") and how long ago that was. */
const MemoryCard: Component<{
  memory: MemorySummary;
  onClick: () => void;
  // as wide as its container instead of a fixed width
  fluid?: boolean;
}> = (props) => {
  return (
    <button type="button" class={styles.root} data-fluid={props.fluid ?? false} onClick={props.onClick}>
      <div class={styles.cover}>
        <img src={thumbnailUrl(props.memory.cover.id, props.memory.cover.version, thumbnailSize(320))} alt="" loading="lazy" decoding="async" draggable={false} />
      </div>
      <div class={styles.text}>
        <UKText role="title" size="m" emphasized class={styles.title}>
          {props.memory.place ?? memoryMonth(props.memory.id)}
        </UKText>
        <UKText role="body" size="m" class={styles.age}>
          {memoryAge(props.memory.id)}
        </UKText>
      </div>
    </button>
  );
};

export default MemoryCard;
