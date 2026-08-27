import APPS_ICON from "@material-symbols/svg-700/outlined/apps.svg";
import REWARDED_ADS_ICON from "@material-symbols/svg-700/outlined/rewarded_ads.svg";
import SEARCH_ICON from "@material-symbols/svg-700/outlined/search.svg";
import UKCircularProgressIndicator from "@ewsgit/uikit-solid/src/components/circularProgressIndicator/UKCircularProgressIndicator.tsx";
import UKSideBar from "@ewsgit/uikit-solid/src/components/sideBar/UKSideBar.tsx";
import {useLocation, useNavigate} from "@solidjs/router";
import {type Component, type ParentProps, Suspense} from "solid-js";
import styles from "./Layout.module.scss";
import {MetaProvider, Title} from "@solidjs/meta";

const Layout: Component<ParentProps> = (props) => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <>
      <MetaProvider>
        <Title>Store</Title>
      </MetaProvider>
      <UKSideBar
        items={[
          {
            type: "label",
            label: "Store",
          },
          {
            type: "button",
            icon: {type: "icon", value: REWARDED_ADS_ICON},
            label: "Promoted Applications",
            onClick() {
              navigate("/app/uk.ewsgit.store/");
            },
            active: location.pathname === "/app/uk.ewsgit.store" || location.pathname === "/app/uk.ewsgit.store/",
          },
          {
            type: "button",
            icon: {type: "icon", value: SEARCH_ICON},
            label: "Search",
            onClick() {
              navigate("/app/uk.ewsgit.store/search");
            },
            active: location.pathname === "/app/uk.ewsgit.store/search",
          },
          {
            type: "button",
            icon: {type: "icon", value: APPS_ICON},
            label: "Installed",
            onClick() {
              navigate("/app/uk.ewsgit.store/manage-installed");
            },
            active: location.pathname === "/app/uk.ewsgit.store/manage-installed",
          },
        ]}
      >
        <Suspense fallback={<UKCircularProgressIndicator class={styles.spinner}/>}>{props.children}</Suspense>
      </UKSideBar>
    </>
  );
};

export default Layout;
