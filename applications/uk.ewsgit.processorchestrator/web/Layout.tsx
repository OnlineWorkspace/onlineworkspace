import UKCircularProgressIndicator from "@ewsgit/uikit-solid/src/components/circularProgressIndicator/UKCircularProgressIndicator.tsx";
import UKIcon from "@ewsgit/uikit-solid/src/components/icon/UKIcon.tsx";
import UKNavigationBar from "@ewsgit/uikit-solid/src/components/navigationBar/UKNavigationBar.tsx";
import UKSideBar from "@ewsgit/uikit-solid/src/components/sideBar/UKSideBar.tsx";
import UKSnackbar from "@ewsgit/uikit-solid/src/components/snackbar/UKSnackbar.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import useIsMobile from "@ewsgit/uikit-solid/src/core/useIsMobile.ts";
import HISTORY_ICON from "@material-symbols/svg-700/outlined/history.svg";
import HISTORY_FILL_ICON from "@material-symbols/svg-700/outlined/history-fill.svg";
import TERMINAL_ICON from "@material-symbols/svg-700/outlined/terminal.svg";
import TERMINAL_FILL_ICON from "@material-symbols/svg-700/outlined/terminal-fill.svg";
import { MetaProvider, Title } from "@solidjs/meta";
import { useLocation, useNavigate } from "@solidjs/router";
import { type Component, type ParentProps, Show, Suspense } from "solid-js";
import styles from "./Layout.module.scss";
import ProcessesProvider, { useProcesses } from "./lib/ProcessesProvider";
import { routes } from "./lib/routes";

const Chrome: Component<ParentProps> = (props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { message, dismissMessage } = useProcesses();

  const onActivity = () => location.pathname.replace(/\/+$/, "").endsWith("/activity");
  // the detail pages belong to Processes
  const onProcesses = () => !onActivity();

  const page = () => <Suspense fallback={<UKCircularProgressIndicator class={styles.spinner} />}>{props.children}</Suspense>;

  const header = () => (
    <div class={styles.brand}>
      <div class={styles.brandIcon}>
        <UKIcon>{TERMINAL_ICON}</UKIcon>
      </div>
      <UKText role="title" size="l">
        Process Orchestrator
      </UKText>
    </div>
  );

  return (
    <>
      <MetaProvider>
        <Title>Process Orchestrator</Title>
      </MetaProvider>

      <Show
        when={isMobile()}
        fallback={
          <UKSideBar
            items={[
              { type: "component", component: header },
              {
                type: "button",
                icon: { type: "icon", value: onProcesses() ? TERMINAL_FILL_ICON : TERMINAL_ICON },
                label: "Processes",
                onClick: () => navigate(routes.list()),
                active: onProcesses(),
              },
              {
                type: "button",
                icon: { type: "icon", value: onActivity() ? HISTORY_FILL_ICON : HISTORY_ICON },
                label: "Activity",
                onClick: () => navigate(routes.activity()),
                active: onActivity(),
              },
            ]}
          >
            {page()}
          </UKSideBar>
        }
      >
        <div class={styles.mobile}>
          <div class={styles.mobilePage}>{page()}</div>
          <UKNavigationBar
            items={[
              { icon: TERMINAL_ICON, activeIcon: TERMINAL_FILL_ICON, label: "Processes", active: onProcesses(), onClick: () => navigate(routes.list()) },
              { icon: HISTORY_ICON, activeIcon: HISTORY_FILL_ICON, label: "Activity", active: onActivity(), onClick: () => navigate(routes.activity()) },
            ]}
          />
        </div>
      </Show>

      <Show when={message()}>{(text) => <UKSnackbar class={styles.snackbar} message={text()} onDismiss={dismissMessage} />}</Show>
    </>
  );
};

const Layout: Component<ParentProps> = (props) => (
  <ProcessesProvider>
    <Chrome>{props.children}</Chrome>
  </ProcessesProvider>
);

export default Layout;
