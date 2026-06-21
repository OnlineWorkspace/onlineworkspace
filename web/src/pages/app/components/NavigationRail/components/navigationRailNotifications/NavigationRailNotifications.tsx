import NOTIFICATIONS_ICON from "@material-symbols/svg-700/outlined/notifications.svg";
import NOTIFICATIONS_UNREAD_ICON from "@material-symbols/svg-700/outlined/notifications_unread.svg";
import { DividerDirection } from "@ewsgit/uikit-solid/src/components/divider/lib/direction.ts";
import UKDivider from "@ewsgit/uikit-solid/src/components/divider/UKDivider.tsx";
import UKIconButton from "@ewsgit/uikit-solid/src/components/iconButton/UKIconButton.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import { useNavigate } from "@solidjs/router";
import { type Component, createSignal, For } from "solid-js";
import type { WorkspacesNotification } from "../../../../../../../../systems/notifications";
import trpc from "../../../../../../lib/trpc";
import styles from "./NavigationRailNotifications.module.scss";
import Notification from "./notification/Notification";

// const FLYOUT_NOTIFICATION_TIMEOUT = 10_000;

const NavigationRailNotifications: Component<{
  expanded: boolean;
  toggle: (text: "notifications") => void;
  isToggled: boolean;
}> = (props) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = createSignal<WorkspacesNotification[]>([]);
  const [flyoutNotifications, setFlyoutNotifications] = createSignal<WorkspacesNotification[]>([]);
  // let subscription: Unsubscribable;
  //
  // onMount(() => {
  //     subscription = trpc.app.notifications.listener.subscribe(undefined, {
  //         onData(data) {
  //             // @ts-ignore
  //             setFlyoutNotifications((not) => {
  //                 return [...not, data];
  //             });
  //
  //             // @ts-ignore
  //             setNotifications((not) => {
  //                 return [...not, data];
  //             });
  //
  //             // if not urgent, remove after FLYOUT_NOTIFICATION_TIMEOUT
  //             if (data.priority !== 2) {
  //                 setTimeout(() => {
  //                     setFlyoutNotifications((not) => not.filter((n) => n.uuid !== data.uuid));
  //                 }, FLYOUT_NOTIFICATION_TIMEOUT);
  //             }
  //         },
  //     });
  // });
  //
  // onCleanup(() => {
  //     subscription.unsubscribe();
  // });

  return (
    <div class={styles.root} data-expanded={props.expanded}>
      <UKIconButton
        color={props.isToggled ? "filled" : "standard"}
        shape={props.isToggled ? "square" : "round"}
        icon={flyoutNotifications().length !== 0 ? NOTIFICATIONS_UNREAD_ICON : NOTIFICATIONS_ICON}
        alt="notifications"
        onClick={() => {
          props.toggle("notifications");
        }}
      />
      <div class={styles.flyoutNotifications}>
        <For each={flyoutNotifications()}>
          {(notification) => (
            <Notification
              respond={async (type, value) => {
                if (type === "close") {
                  setFlyoutNotifications((notifications) => notifications.filter((n) => n.uuid !== notification.uuid));
                  setNotifications((notifications) => notifications.filter((n) => n.uuid !== notification.uuid));

                  return;
                }

                const responseAction = await trpc.app.notifications.respond.mutate({
                  uuid: notification.uuid,
                  responseType: type,
                  value: value,
                });

                if (responseAction.action?.type === "navigate") {
                  navigate(responseAction.action.value);
                }

                if (responseAction.action?.type === "reload") {
                  window.location.reload();
                }

                setFlyoutNotifications((notifications) => notifications.filter((n) => n.uuid !== notification.uuid));
                setNotifications((notifications) => notifications.filter((n) => n.uuid !== notification.uuid));
              }}
              notification={notification}
            />
          )}
        </For>
      </div>
      {props.isToggled && (
        <div class={styles.notifications}>
          {notifications().length > 0 ? (
            <For each={notifications()}>
              {(notification) => (
                <Notification
                  respond={async (type, value) => {
                    const responseAction = await trpc.app.notifications.respond.mutate({
                      uuid: notification.uuid,
                      responseType: type as "button",
                      value: value,
                    });

                    if (responseAction.action?.type === "navigate") {
                      navigate(responseAction.action.value);
                    }

                    if (responseAction.action?.type === "reload") {
                      window.location.reload();
                    }

                    setNotifications((notifications) => notifications.filter((n) => n.uuid !== notification.uuid));
                    setFlyoutNotifications((notifications) => notifications.filter((n) => n.uuid !== notification.uuid));
                  }}
                  notification={notification}
                />
              )}
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
