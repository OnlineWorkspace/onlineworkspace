import { useLocation, useNavigate } from "@solidjs/router";
import UKNavigationRail from "@tcsw/uikit-solid/src/components/navigationRail/UKNavigationRail.jsx";
import  { type Component, type ParentProps, Suspense } from "solid-js";
import UKSideBar from "@tcsw/uikit-solid/src/components/sideBar/UKSideBar.tsx";
import UKIndeterminateSpinner
  from "@tcsw/uikit-solid/src/components/indeterminateSpinner/UKIndeterminateSpinner.tsx";

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
            icon: { type: "icon", value: "search" },
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
            icon: { type: "icon", value: "apps" },
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
