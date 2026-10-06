import CLOSE_ICON from "@material-symbols/svg-700/outlined/close.svg";
import NOTIFICATIONS_ICON from "@material-symbols/svg-700/outlined/notifications.svg";
import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.tsx";
import UKIconButton from "@ewsgit/uikit-solid/src/components/iconButton/UKIconButton.tsx";
import UKIcon from "@ewsgit/uikit-solid/src/components/icon/UKIcon.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import { type Component, For, Show } from "solid-js";
import backend from "../../../../../../../lib/backend";
import type { ClientNotification } from "../../../../../../../lib/notifications";
import styles from "./Notification.module.scss";

/** notification icons are material symbol names (e.g. "check"); anything that already looks like a url is used as is */
const iconUrl = (icon?: string) => {
  if (!icon) return NOTIFICATIONS_ICON;
  if (/^(https?:|data:|\/)/.test(icon)) return icon;

  return backend(`/api/material-symbol/${encodeURIComponent(icon)}`);
};

const PRIORITY_NAMES = ["normal", "important", "urgent"] as const;

const Notification: Component<{
  notification: ClientNotification;
  respond: (type: "button" | "close", value: string) => void;
}> = (props) => {
  const buttons = () => props.notification.options?.buttons ?? [];

  return (
    <UKCard class={styles.root} data-priority={PRIORITY_NAMES[props.notification.priority] ?? "normal"}>
      <div class={styles.header}>
        <span class={styles.sourceIcon}>
          <UKIcon>{iconUrl(props.notification.content.icon)}</UKIcon>
        </span>
        <UKText role="label" size="m" class={styles.source}>
          {props.notification.sourceName}
        </UKText>
        <UKIconButton class={styles.close} color="standard" icon={CLOSE_ICON} alt="Dismiss notification" onClick={() => props.respond("close", "")} />
      </div>
      <UKText role="title" size="m" class={styles.title}>
        {props.notification.content.title}
      </UKText>
      <UKText role="body" size="m" class={styles.body}>
        {props.notification.content.body}
      </UKText>
      <Show when={buttons().length > 0}>
        <div class={styles.footer}>
          <For each={buttons()}>
            {(btn) => (
              <UKButton color={btn.type} onClick={() => props.respond("button", btn.id)}>
                {btn.label}
              </UKButton>
            )}
          </For>
        </div>
      </Show>
    </UKCard>
  );
};

export default Notification;
