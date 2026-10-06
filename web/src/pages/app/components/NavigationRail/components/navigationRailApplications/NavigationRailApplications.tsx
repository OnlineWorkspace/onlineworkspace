import APPS_ICON from "@material-symbols/svg-700/outlined/apps.svg";
import UKBadge from "@ewsgit/uikit-solid/src/components/badge/UKBadge.tsx";
import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.tsx";
import { DividerDirection } from "@ewsgit/uikit-solid/src/components/divider/lib/direction.ts";
import UKDivider from "@ewsgit/uikit-solid/src/components/divider/UKDivider.tsx";
import UKIcon from "@ewsgit/uikit-solid/src/components/icon/UKIcon.tsx";
import UKIconButton from "@ewsgit/uikit-solid/src/components/iconButton/UKIconButton.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import { useNavigate } from "@solidjs/router";
import { type Component, createResource, createSignal, For, onCleanup, onMount, Show } from "solid-js";
import notificationStore, { type ClientNotification } from "../../../../../../lib/notifications";
import trpc from "../../../../../../lib/trpc";
import Notification from "../navigationRailNotifications/notification/Notification";
import styles from "./NavigationRailApplications.module.scss";

const FLYOUT_NOTIFICATION_TIMEOUT = 10_000;
const NOTIFICATION_PRIORITY_URGENT = 2;

const NavigationRailApplications: Component<{
  expanded: boolean;
  toggle: (text: "applications") => void;
  isToggled: boolean;
  /** the square logo is shown directly above, and so has the auto top margin instead */
  hasLogo?: boolean;
}> = (props) => {
  const navigate = useNavigate();
  const [applications] = createResource(() => trpc.app.navigation.getApplications.query());
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

  const clearAll = () => {
    for (const notification of notifications()) notificationStore.dismiss(notification.uuid);
    setFlyoutNotifications([]);
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
    <div class={styles.root} data-expanded={props.expanded} data-has-logo={!!props.hasLogo}>
      <UKBadge count={notifications().length}>
        <UKIconButton
          alt={"Toggle applications and notifications"}
          icon={APPS_ICON}
          color={props.isToggled ? "filled" : "standard"}
          shape={props.isToggled ? "square" : "round"}
          onClick={() => {
            props.toggle("applications");
          }}
        />
      </UKBadge>
      <Show when={!props.isToggled}>
        <div class={styles.toasts}>
          <For each={flyoutNotifications()}>
            {(notification) => <Notification respond={(type, value) => respond(notification, type, value)} notification={notification} />}
          </For>
        </div>
      </Show>
      {props.isToggled && (
        <div class={styles.flyout}>
          <div class={styles.header}>
            <UKText role="title" size="l">
              Notifications
            </UKText>
            <Show when={notifications().length > 0}>
              <UKButton color="standard" onClick={clearAll}>
                Clear all
              </UKButton>
            </Show>
          </div>
          <Show
            when={notifications().length > 0}
            fallback={
              <UKText role="body" size="m" class={styles.message}>
                You're all caught up.
              </UKText>
            }
          >
            <div class={styles.notificationList}>
              <For each={notifications()}>
                {(notification) => <Notification respond={(type, value) => respond(notification, type, value)} notification={notification} />}
              </For>
            </div>
          </Show>
          <UKDivider direction={DividerDirection.horizontal} />
          <div class={styles.header}>
            <UKText role="title" size="l">
              Applications
            </UKText>
            <Show when={applications()?.length}>
              <UKText role="label" size="m" class={styles.count}>
                {applications()?.length}
              </UKText>
            </Show>
          </div>
          <Show
            when={!applications.loading && applications()?.length !== 0}
            fallback={
              <UKText role="body" size="m" align="center" class={styles.message}>
                {applications.loading ? "Loading applications…" : "No applications are available."}
              </UKText>
            }
          >
            <div class={styles.appsGrid}>
              <For each={applications()}>
                {(app) => (
                  <UKCard
                    class={styles.application}
                    onClick={() => {
                      if (app.location.type === "local") {
                        navigate(app.location.value);
                        props.toggle("applications");
                      } else if (app.location.type === "remote") {
                        window.location.href = app.location.value;
                      }
                    }}
                  >
                    <span class={styles.iconContainer}>
                      <Show when={app.icon.type === "icon"}>
                        <UKIcon>{app.icon.value}</UKIcon>
                      </Show>
                      <Show when={app.icon.type === "image"}>
                        <img class={styles.applicationImageIcon} alt="" src={app.icon.value} draggable={false} />
                      </Show>
                    </span>
                    <UKText role="label" size="m" align="center" class={styles.label}>
                      {app.label}
                    </UKText>
                  </UKCard>
                )}
              </For>
            </div>
          </Show>
        </div>
      )}
    </div>
  );
};

export default NavigationRailApplications;
