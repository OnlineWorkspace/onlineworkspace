import NOTIFICATIONS_ICON from "@material-symbols/svg-700/outlined/notifications.svg";
import NOTIFICATIONS_UNREAD_ICON from "@material-symbols/svg-700/outlined/notifications_unread.svg";
import { DividerDirection } from "@ewsgit/uikit-solid/src/components/divider/lib/direction.ts";
import UKDivider from "@ewsgit/uikit-solid/src/components/divider/UKDivider.tsx";
import UKIconButton from "@ewsgit/uikit-solid/src/components/iconButton/UKIconButton.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import { useNavigate } from "@solidjs/router";
import { type Component, createSignal, For, onCleanup, onMount } from "solid-js";
import notificationStore, { type ClientNotification } from "../../../../../../lib/notifications";
import styles from "./NavigationRailNotifications.module.scss";
import Notification from "./notification/Notification";

const FLYOUT_NOTIFICATION_TIMEOUT = 10_000;
const NOTIFICATION_PRIORITY_URGENT = 2;

const NavigationRailNotifications: Component<{
  expanded: boolean;
  toggle: (text: "notifications") => void;
  isToggled: boolean;
}> = (props) => {
  const navigate = useNavigate();
  const notifications = notificationStore.notifications;
  const [flyoutNotifications, setFlyoutNotifications] = createSignal<ClientNotification[]>([]);

  const removeFlyout = (uuid: string) => setFlyoutNotifications((current) => current.filter((n) => n.uuid !== uuid));

  const respond = async (notification: ClientNotification, type: "button" | "close", value: string) => {
    removeFlyout(notification.uuid);

    if (type === "close") {
      notificationStore.dismiss(notification.uuid);

      return;
    }

    const action = await notificationStore.respond(notification.uuid, value);

    if (action?.type === "navigate") navigate(action.value);
    if (action?.type === "reload") window.location.reload();
  };

  onMount(() => {
    const unsubscribe = notificationStore.onNotification((notification) => {
      setFlyoutNotifications((current) => [...current.filter((n) => n.uuid !== notification.uuid), notification]);

      // urgent notifications stay until the user deals with them
      if (notification.priority !== NOTIFICATION_PRIORITY_URGENT) {
        setTimeout(() => removeFlyout(notification.uuid), FLYOUT_NOTIFICATION_TIMEOUT);
      }
    });

    notificationStore.start();

    onCleanup(() => {
      unsubscribe();
      notificationStore.stop();
    });
  });

  return (
    <div class={styles.root} data-expanded={props.expanded}>
      <UKIconButton
        color={props.isToggled ? "filled" : "standard"}
        shape={props.isToggled ? "square" : "round"}
        icon={notifications().length !== 0 ? NOTIFICATIONS_UNREAD_ICON : NOTIFICATIONS_ICON}
        alt="notifications"
        onClick={() => {
          props.toggle("notifications");
        }}
      />
      <div class={styles.flyoutNotifications}>
        <For each={flyoutNotifications()}>
          {(notification) => <Notification respond={(type, value) => respond(notification, type, value)} notification={notification} />}
        </For>
      </div>
      {props.isToggled && (
        <div class={styles.notifications}>
          {notifications().length > 0 ? (
            <For each={notifications()}>
              {(notification) => <Notification respond={(type, value) => respond(notification, type, value)} notification={notification} />}
            </For>
          ) : (
            <div class={styles.noNotificationsMessage}>
              <UKText role="title" size="l" align="center">
                Nothing here
              </UKText>
              <UKDivider width="middle-inset" direction={DividerDirection.horizontal} />
              <UKText role="body" size="m" align="center">
                You have no notifications, when you have a notification it will show up here.
              </UKText>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NavigationRailNotifications;
