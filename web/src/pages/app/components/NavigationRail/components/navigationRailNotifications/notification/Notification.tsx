import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.tsx";
import { DividerDirection } from "@ewsgit/uikit-solid/src/components/divider/lib/direction.ts";
import UKDivider from "@ewsgit/uikit-solid/src/components/divider/UKDivider.tsx";
import UKIcon from "@ewsgit/uikit-solid/src/components/icon/UKIcon.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import { type Component, For } from "solid-js";
import type { WorkspacesNotification } from "../../../../../../../../../systems/notifications";
import styles from "./Notification.module.scss";

const Notification: Component<{
  notification: WorkspacesNotification;
  respond: (type: "button" | "close", value: string) => void;
}> = (props) => {
  return (
    <UKCard
      class={styles.root}
      onClick={() => {
        if (!props.notification.options?.buttons || props.notification.options.buttons.length === 0) {
          props.respond("close", "");
        }
      }}
    >
      <div class={styles.progressBar}></div>
      <div class={styles.header}>
        {props.notification.content.icon && <UKIcon>{props.notification.content.icon}</UKIcon>}
        <UKText role="title" size="m">
          {props.notification.content.title}
        </UKText>
      </div>
      <UKDivider direction={DividerDirection.horizontal} />
      <UKText role="body" size="m" class={styles.body}>
        {props.notification.content.body}
      </UKText>
      <div class={styles.footer}>
        <For each={props.notification.options?.buttons}>
          {(btn) => (
            <UKButton
              color={btn.type}
              onClick={() => {
                props.respond("button", btn.id);
              }}
            >
              {btn.label}
            </UKButton>
          )}
        </For>
      </div>
    </UKCard>
  );
};

export default Notification;
