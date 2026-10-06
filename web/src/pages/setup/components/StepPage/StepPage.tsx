import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import { type Component, type JSX, Show } from "solid-js";
import styles from "./StepPage.module.scss";

/** The layout of a wizard step: a large heading, the content and a bar of actions which stays at the bottom of the screen. */
const StepPage: Component<{ title: string; description?: string; actions?: JSX.Element; children: JSX.Element }> = (props) => (
  <section class={styles.page}>
    <div class={styles.content}>
      <header class={styles.header}>
        <UKText role={"display"} size={"s"} emphasized={true} align={"start"} class={styles.title}>
          {props.title}
        </UKText>
        <Show when={props.description}>
          <UKText role={"body"} size={"l"} align={"start"} class={styles.description}>
            {props.description}
          </UKText>
        </Show>
      </header>
      <div class={styles.body}>{props.children}</div>
    </div>
    <Show when={props.actions}>
      <footer class={styles.actions}>
        <div class={styles.actionsInner}>{props.actions}</div>
      </footer>
    </Show>
  </section>
);

export default StepPage;
