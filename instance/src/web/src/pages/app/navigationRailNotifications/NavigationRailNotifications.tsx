import { createEffect, createSignal, For, onCleanup, onMount, type Component } from "solid-js";
import trpc from "../../../lib/trpc";
import { type WorkspacesNotification } from "../../../../../subsystems/notifications";
import Notification from "./notification/Notification";
import styles from "./NavigationRailNotifications.module.scss";
import UKIconButton from "@tcsw/uikit-solid/src/components/iconButton/UKIconButton.jsx";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.jsx";
import UKDivider from "@tcsw/uikit-solid/src/components/divider/UKDivider.jsx";
import { DividerDirection } from "@tcsw/uikit-solid/src/components/divider/lib/direction.js";
import { useNavigate } from "@solidjs/router";
import type { Unsubscribable } from "@trpc/server/observable";

const FLYOUT_NOTIFICATION_TIMEOUT = 10_000;

const NavigationRailNotifications: Component<{ expanded: boolean }> = (props) => {
    const navigate = useNavigate();
    const [toggled, setToggled] = createSignal<boolean>(false);
    const [notifications, setNotifications] = createSignal<WorkspacesNotification[]>([]);
    const [flyoutNotifications, setFlyoutNotifications] = createSignal<WorkspacesNotification[]>([]);
    let subscription: Unsubscribable;

    onMount(() => {
        subscription = trpc.app.notifications.listener.subscribe(undefined, {
            onData(data) {
                // @ts-ignore
                setFlyoutNotifications((not) => {
                    return [...not, data];
                });

                // @ts-ignore
                setNotifications((not) => {
                    return [...not, data];
                });

                // if not urgent, remove after FLYOUT_NOTIFICATION_TIMEOUT
                if (data.priority !== 2) {
                    setTimeout(() => {
                        setFlyoutNotifications((not) => not.filter((n) => n.uuid !== data.uuid));
                    }, FLYOUT_NOTIFICATION_TIMEOUT);
                }
            },
        });
    });

    onCleanup(() => {
        subscription.unsubscribe();
    });

    return (
        <div class={styles.root} data-expanded={props.expanded}>
            <UKIconButton
                color={toggled() ? "filled" : "standard"}
                shape={toggled() ? "square" : "round"}
                icon={flyoutNotifications().length !== 0 ? "notifications_unread" : "notifications"}
                alt="notifications"
                onClick={() => {
                    setToggled((toggled) => !toggled);
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

                                let responseAction = await trpc.app.notifications.respond.mutate({
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
            {toggled() && (
                <>
                    <div class={styles.notifications}>
                        {notifications().length > 0 ? (
                            <For each={notifications()}>
                                {(notification) => (
                                    <Notification
                                        respond={async (type, value) => {
                                            let responseAction = await trpc.app.notifications.respond.mutate({
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
                                            setFlyoutNotifications((notifications) =>
                                                notifications.filter((n) => n.uuid !== notification.uuid),
                                            );
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
                </>
            )}
        </div>
    );
};

export default NavigationRailNotifications;
