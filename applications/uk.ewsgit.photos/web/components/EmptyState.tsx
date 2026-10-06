import UKIcon from "@ewsgit/uikit-solid/src/components/icon/UKIcon.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import { type Component, type JSX, Show } from "solid-js";
import styles from "./EmptyState.module.scss";

const EmptyState: Component<{ icon: string; title: string; body?: string; children?: JSX.Element }> = (props) => {
  return (
    <div class={styles.root}>
      <UKIcon class={styles.icon}>{props.icon}</UKIcon>
      <UKText role="title" size="l" align="center">
        {props.title}
      </UKText>
      <Show when={props.body}>
        <UKText role="body" size="m" align="center" class={styles.body}>
          {props.body}
        </UKText>
      </Show>
      {props.children}
    </div>
  );
};

export default EmptyState;
