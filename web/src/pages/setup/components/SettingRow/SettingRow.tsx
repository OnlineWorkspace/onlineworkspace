import UKSwitch from "@ewsgit/uikit-solid/src/components/switch/UKSwitch.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import { type Component, Show } from "solid-js";
import styles from "./SettingRow.module.scss";

/** a labelled on / off setting */
const SettingRow: Component<{ label: string; supporting?: string; value: boolean; onValueChange(value: boolean): void; disabled?: boolean }> = (props) => (
  <div class={styles.row}>
    <div class={styles.text}>
      <UKText role={"body"} size={"l"} align={"start"}>
        {props.label}
      </UKText>
      <Show when={props.supporting}>
        <UKText role={"body"} size={"s"} align={"start"} class={styles.supporting}>
          {props.supporting}
        </UKText>
      </Show>
    </div>
    <UKSwitch value={props.value} onValueChange={props.onValueChange} disabled={props.disabled} />
  </div>
);

export default SettingRow;
