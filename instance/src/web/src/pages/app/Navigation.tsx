import { useLocation, useNavigate } from "@solidjs/router";
import UKIndeterminateSpinner from "@tcsw/uikit-solid/src/components/indeterminateSpinner/UKIndeterminateSpinner.jsx";
import UKNavigationRail from "@tcsw/uikit-solid/src/components/navigationRail/UKNavigationRail.jsx";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.jsx";
import useIsMobile from "@tcsw/uikit-solid/src/core/useIsMobile.js";
import { type Component, createResource, createSignal, type ParentProps, Show, Suspense } from "solid-js";
import trpc from "../../lib/trpc";
import styles from "./Navigation.module.scss";
import NavigationRailApplications from "./navigationRailApplications/NavigationRailApplications";
import NavigationRailAvatar from "./navigationRailAvatar/NavigationRailAvatar";
import NavigationRailClock from "./navigationRailClock/NavigationRailClock";
import NavigationRailNotifications from "./navigationRailNotifications/NavigationRailNotifications";

const AppNavigation: Component<ParentProps> = (props) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [quickShortcuts] = createResource(() => trpc.app.navigation.getQuickShortcuts.query());
  const [expanded, setExpanded] = createSignal<boolean>(false);
  const [toggledDrawer, setToggledDrawer] = createSignal<"applications" | "notifications" | false>(false);

  return (
    <UKNavigationRail
      class={styles.rail}
      expanded={!isMobile() ? expanded() : false}
      items={[
        ...(quickShortcuts() || []).map((sc) => {
          return {
            icon: sc.icon || {
              type: "icon",
              value: "indeterminate_question_box",
            },
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
            },
          };
        }),
      ]}
      setExpanded={!isMobile() ? (exp) => setExpanded(exp) : undefined}
      anchorPoints={{
        topMost: (
          <>
            <Show when={!isMobile()}>
              <NavigationRailClock expanded={expanded()} />
            </Show>
          </>
        ),
        top: (
          <>
            <NavigationRailAvatar expanded={expanded()} />
          </>
        ),
        bottom: (
          <>
            <NavigationRailApplications
              isToggled={toggledDrawer() === "applications"}
              toggle={(str) => {
                if (toggledDrawer() === "applications") {
                  setToggledDrawer(false);
                } else {
                  setToggledDrawer(str);
                }
              }}
              expanded={expanded()}
            />
            <Show when={!isMobile()}>
              <UKText class={styles.versionLabel} role={"label"} size={"s"} emphasized={true} align={"center"}>
                Dev Build
              </UKText>
            </Show>
            <NavigationRailNotifications
              isToggled={toggledDrawer() === "notifications"}
              toggle={(str) => {
                if (toggledDrawer() === "notifications") {
                  setToggledDrawer(false);
                } else {
                  setToggledDrawer(str);
                }
              }}
              expanded={expanded()}
            />
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

export default AppNavigation;
