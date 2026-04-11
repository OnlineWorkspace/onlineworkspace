import APPS_ICON from "@material-symbols/svg-700/outlined/apps.svg";
import REWARDED_ADS_ICON from "@material-symbols/svg-700/outlined/rewarded_ads.svg";
import SEARCH_ICON from "@material-symbols/svg-700/outlined/search.svg";
import UKIndeterminateSpinner from "@onlineworkspace/uikit-solid/src/components/indeterminateSpinner/UKIndeterminateSpinner.tsx";
import UKSideBar from "@onlineworkspace/uikit-solid/src/components/sideBar/UKSideBar.tsx";
import { useLocation, useNavigate } from "@solidjs/router";
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
          icon: { type: "icon", value: REWARDED_ADS_ICON },
          label: "Promoted Applications",
          onClick() {
            navigate("/app/uk.ewsgit.store/");
          },
          active: location.pathname === "/app/uk.ewsgit.store" || location.pathname === "/app/uk.ewsgit.store/",
        },
        {
          type: "button",
          icon: { type: "icon", value: SEARCH_ICON },
          label: "Search",
          onClick() {
            navigate("/app/uk.ewsgit.store/search");
          },
          active: location.pathname === "/app/uk.ewsgit.store/search",
        },
        {
          type: "button",
          icon: { type: "icon", value: APPS_ICON },
          label: "Installed",
          onClick() {
            navigate("/app/uk.ewsgit.store/manage-installed");
          },
          active: location.pathname === "/app/uk.ewsgit.store/manage-installed",
        },
      ]}
    >
      <Suspense fallback={<UKIndeterminateSpinner class={styles.spinner} />}>{props.children}</Suspense>
    </UKSideBar>
  );
};

export default Layout;
