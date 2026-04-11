import UKIndeterminateSpinner from "@onlineworkspace/uikit-solid/src/components/indeterminateSpinner/UKIndeterminateSpinner.jsx";
import type { RouteSectionProps } from "@solidjs/router";
import { type Component, lazy, Suspense } from "solid-js";
import styles from "./Layout.module.scss";

const AppNavigation = lazy(() => import("./Navigation.tsx"));

const AppLayout: Component<RouteSectionProps<unknown>> = (props) => {
  return (
    <>
      {window.localStorage.getItem("onlineworkspace_workspace_no_app_navigation_rail") !== "true" ? (
        <AppNavigation>
          <Suspense fallback={<UKIndeterminateSpinner />}>{props.children}</Suspense>
        </AppNavigation>
      ) : (
        <div class={styles.page}>
          <Suspense fallback={<UKIndeterminateSpinner />}>{props.children}</Suspense>
        </div>
      )}
    </>
  );
};

export default AppLayout;
