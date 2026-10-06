import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import { type Component, Show } from "solid-js";
import styles from "./StageHeader.module.scss";

/** the title block shared by every signup stage */
const StageHeader: Component<{ title: string; description?: string }> = (props) => (
  <div class={styles.header}>
    <UKText role={"headline"} size={"s"} emphasized={true} align={"start"} class={styles.title}>
      {props.title}
    </UKText>
    <Show when={props.description}>
      <UKText role={"body"} size={"m"} align={"start"} class={styles.description}>
        {props.description}
      </UKText>
    </Show>
  </div>
);

export default StageHeader;
