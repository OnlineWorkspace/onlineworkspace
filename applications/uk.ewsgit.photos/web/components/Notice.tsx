import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKIcon from "@ewsgit/uikit-solid/src/components/icon/UKIcon.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import { type Component, Show } from "solid-js";
import styles from "./Notice.module.scss";

/**
 * A message about why something is not available.
 * "instance" is a limit set by the administrator that the user cannot change, "personal" is the user's own choice and can be undone.
 */
const Notice: Component<{
  kind: "instance" | "personal";
  icon: string;
  title: string;
  body: string;
  action?: { label: string; onClick: () => void };
}> = (props) => {
  return (
    <div class={styles.root} data-kind={props.kind} role="status">
      <UKIcon class={styles.icon}>{props.icon}</UKIcon>
      <div class={styles.text}>
        <UKText role="title" size="m" emphasized>
          {props.title}
        </UKText>
        <UKText role="body" size="m">
          {props.body}
        </UKText>
      </div>
      <Show when={props.action}>
        {(action) => (
          <UKButton color="tonal" onClick={action().onClick}>
            {action().label}
          </UKButton>
        )}
      </Show>
    </div>
  );
};

export default Notice;
