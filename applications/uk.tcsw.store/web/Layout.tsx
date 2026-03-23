import APPS_ICON from "@material-symbols/svg-700/outlined/apps.svg";
import SEARCH_ICON from "@material-symbols/svg-700/outlined/search.svg";
import { useLocation, useNavigate } from "@solidjs/router";
import UKIndeterminateSpinner from "@tcsw/uikit-solid/src/components/indeterminateSpinner/UKIndeterminateSpinner.tsx";
import UKSideBar from "@tcsw/uikit-solid/src/components/sideBar/UKSideBar.tsx";
import { type Component, type ParentProps, Suspense } from "solid-js";
import styles from "./Layout.module.scss";

const Layout: Component<ParentProps> = (props) => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <UKSideBar
      items={[
        {
          type: "label",
          label: "Store",
        },
        {
          type: "button",
          icon: { type: "icon", value: SEARCH_ICON },
          label: "Search",
          onClick() {
            navigate("/app/uk.tcsw.store/search");
          },
          active:
            location.pathname === "/app/uk.tcsw.store/search" ||
            location.pathname === "/app/uk.tcsw.store",
        },
        {
          type: "button",
          icon: { type: "icon", value: APPS_ICON },
          label: "Installed",
          onClick() {
            navigate("/app/uk.tcsw.store/manage-installed");
          },
          active: location.pathname === "/app/uk.tcsw.store/manage-installed",
        },
      ]}
    >
      <Suspense fallback={<UKIndeterminateSpinner class={styles.spinner} />}>
        {props.children}
      </Suspense>
    </UKSideBar>
  );
};

export default Layout;
