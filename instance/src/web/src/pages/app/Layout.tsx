import { createEffect, createResource, createSignal, Suspense, type Component } from "solid-js";
import styles from "./Layout.module.scss";
import { useLocation, useNavigate, type RouteSectionProps } from "@solidjs/router";
import UKIndeterminateSpinner from "@tcsw/uikit-solid/src/components/indeterminateSpinner/UKIndeterminateSpinner.jsx";
import UKNavigationRail from "@tcsw/uikit-solid/src/components/navigationRail/UKNavigationRail.jsx";
import NavigationRailAvatar from "./navigationRailAvatar/NavigationRailAvatar";
import trpc from "../../lib/trpc";
import NavigationRailClock from "./navigationRailClock/NavigationRailClock.tsx";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.tsx";
import NavigationRailNotifications from "./navigationRailNotifications/NavigationRailNotifications.tsx";

const AppLayout: Component<RouteSectionProps<unknown>> = (props) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [quickShortcuts] = createResource(() => trpc.app.navigation.quickShortcuts.query());

    const [expanded, setExpanded] = createSignal<boolean>(false);

    createEffect(() => {
        // @ts-ignore
        trpc.app.notifications.listener.subscribe(undefined, (opt) => {
            console.log(opt);
        });
    });

    return (
        <UKNavigationRail
            class={styles.rail}
            expanded={expanded()}
            items={[
                ...(quickShortcuts() || []).map((sc) => {
                    return {
                        icon: sc.icon.value || "indeterminate_question_box",
                        label: sc.label,
                        active: location.pathname.startsWith(sc.location.value),
                        onClick() {
                            if (sc.location.type === "local") {
                                navigate(sc.location.value);
                            } else if (sc.location.type === "remote") {
                                window.location.href = sc.location.value;
                            }
                        },
                        onMiddleClick() {
                            if (sc.location.type === "local") {
                                window.open(sc.location.value, "_blank");
                            } else if (sc.location.type === "remote") {
                                window.open(sc.location.value, "_blank");
                            }
                        }
                    };
                }),
            ]}
            setExpanded={(exp) => setExpanded(exp)}
            anchorPoints={{
                topMost: (
                    <>
                        <NavigationRailClock expanded={expanded()} />
                    </>
                ),
                top: (
                    <>
                        <NavigationRailAvatar expanded={expanded()} />
                    </>
                ),
                bottom: (
                    <>
                        <UKText class={styles.versionLabel} role={"label"} size={"s"} emphasized={true} align={"center"}>
                            Dev Build
                        </UKText>
                        <NavigationRailNotifications expanded={expanded()} />
                    </>
                ),
            }}
        >
            <div class={styles.page}>
                <Suspense fallback={<UKIndeterminateSpinner />}>{props.children}</Suspense>
            </div>
        </UKNavigationRail>
    );
};

export default AppLayout;
