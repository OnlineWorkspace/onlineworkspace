import APPS_ICON from "@material-symbols/svg-700/outlined/apps.svg";
import UKIconButton from "@ewsgit/uikit-solid/src/components/iconButton/UKIconButton.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import { useNavigate } from "@solidjs/router";
import {type Component, createResource, createSignal, For, Show} from "solid-js";
import trpc from "../../../../../../lib/trpc";
import styles from "./NavigationRailApplications.module.scss";
import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.tsx";
import UKIcon from "@ewsgit/uikit-solid/src/components/icon/UKIcon.tsx";
import UKBadge from "@ewsgit/uikit-solid/src/components/badge/UKBadge.tsx";
import Notification from "../navigationRailNotifications/notification/Notification.tsx";
import type { WorkspacesNotification } from "../../../../../../../../backend/src/systems/notifications.ts";

const NavigationRailApplications: Component<{
  expanded: boolean;
  toggle: (text: "applications") => void;
  isToggled: boolean;
}> = (props) => {
  const navigate = useNavigate();
  const [applications] = createResource(() =>
    trpc.app.navigation.getApplications.query()
  );
  const [notifications, setNotifications] = createSignal<WorkspacesNotification[]>([]);
  const [flyoutNotifications, setFlyoutNotifications] = createSignal<WorkspacesNotification[]>([]);

  return (
    <div class={styles.root} data-expanded={props.expanded}>
      <UKBadge count={notifications().length}>
        <UKIconButton
          alt={"Toggle Applications"}
          icon={APPS_ICON}
          color={props.isToggled ? "filled" : "standard"}
          shape={props.isToggled ? "square" : "round"}
          onClick={() => {
            props.toggle("applications");
          }}
        />
      </UKBadge>
      {props.isToggled && (
        <div class={styles.flyout}>
          <div class={styles.panel}>
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
                <UKText role="title" size="l" emphasized align="center">
                  No Notifications
                </UKText>
                <UKText role="body" size="m" align="center">
                  You have no notifications to view, when you have a notification it will show up here.
                </UKText>
              </div>
            )}
          </div>
          <div class={styles.panel}>
            <UKText role={"title"} size="m">
              All Applications
            </UKText>
            <div class={styles.appsGrid}>
              <For each={applications()}>
                {(app) => {
                  return (
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
                      <Show when={app.icon.type === "icon"}>
                        <UKIcon>{app.icon.value}</UKIcon>
                      </Show>
                      <Show when={app.icon.type === "image"}>
                        <img
                          class={styles.applicationImageIcon}
                          alt=""
                          src={app.icon.value}
                        />
                      </Show>
                      <UKText role={"label"} size="m">
                        {app.label}
                      </UKText>
                    </UKCard>
                  );
                }}
              </For>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NavigationRailApplications;
