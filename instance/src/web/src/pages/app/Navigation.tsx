import UKNavigationRail from "@onlineworkspace/uikit-solid/src/components/navigationRail/UKNavigationRail.jsx";
import UKText from "@onlineworkspace/uikit-solid/src/components/text/UKText.jsx";
import useIsMobile from "@onlineworkspace/uikit-solid/src/core/useIsMobile.js";
import { useLocation, useNavigate } from "@solidjs/router";
import { type Component, createResource, createSignal, type ParentProps, Show } from "solid-js";
import trpc from "../../lib/trpc";
import NavigationRailApplications from "./components/NavigationRail/components/navigationRailApplications/NavigationRailApplications";
import NavigationRailAvatar from "./components/NavigationRail/components/navigationRailAvatar/NavigationRailAvatar";
import NavigationRailClock from "./components/NavigationRail/components/navigationRailClock/NavigationRailClock";
import NavigationRailNotifications from "./components/NavigationRail/components/navigationRailNotifications/NavigationRailNotifications";
import styles from "./Navigation.module.scss";

const AppNavigation: Component<ParentProps> = (props) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [quickShortcuts] = createResource(() => trpc.app.navigation.getQuickShortcuts.query(), { initialValue: [] });
  const [expanded, setExpanded] = createSignal<boolean>(false);
  const [toggledDrawer, setToggledDrawer] = createSignal<"applications" | "notifications" | false>(false);

  return (
    <UKNavigationRail
      class={styles.rail}
      expanded={!isMobile() ? expanded() : false}
      items={quickShortcuts()
        .map((sc) => {
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
        })
        .slice(0, isMobile() ? 3 : undefined)}
      setExpanded={!isMobile() ? (expandedState) => setExpanded(expandedState) : undefined}
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
              toggle={(drawerState) => {
                if (toggledDrawer() === "notifications") {
                  setToggledDrawer(false);
                } else {
                  setToggledDrawer(drawerState);
                }
              }}
              expanded={expanded()}
            />
          </>
        ),
      }}
    >
      <div class={styles.page}>{props.children}</div>
    </UKNavigationRail>
  );
};

export default AppNavigation;
