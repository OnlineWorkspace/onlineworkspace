import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import { type Component, For } from "solid-js";
import styles from "./Summary.module.scss";

/** the values a "Recommended" choice will apply */
const Summary: Component<{ rows: [label: string, value: string][] }> = (props) => (
  <dl class={styles.root}>
    <For each={props.rows}>
      {([label, value]) => (
        <div class={styles.row}>
          <UKText role={"label"} size={"l"} align={"start"} class={styles.label}>
            {label}
          </UKText>
          <UKText role={"body"} size={"m"} align={"end"} class={styles.value}>
            {value}
          </UKText>
        </div>
      )}
    </For>
  </dl>
);

export default Summary;
