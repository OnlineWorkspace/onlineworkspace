import type { RouteSectionProps } from "@solidjs/router";
import UKIndeterminateSpinner from "@tcsw/uikit-solid/src/components/indeterminateSpinner/UKIndeterminateSpinner.jsx";
import { type Component, lazy, Suspense } from "solid-js";
import styles from "./Layout.module.scss";

const AppNavigation = lazy(() => import("./Navigation.tsx"));

const AppLayout: Component<RouteSectionProps<unknown>> = (props) => {
  return (
    <>
      {window.localStorage.getItem("tricolor_workspaces_no_app_navigation_rail") !== "true" ? (
        <AppNavigation>{props.children}</AppNavigation>
      ) : (
        <div class={styles.page}>
          <Suspense fallback={<UKIndeterminateSpinner />}>{props.children}</Suspense>
        </div>
      )}
    </>
  );
};

export default AppLayout;
