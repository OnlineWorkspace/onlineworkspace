import { useLocation, useNavigate } from "@solidjs/router";
import UKIndeterminateSpinner from "@tcsw/uikit-solid/src/components/indeterminateSpinner/UKIndeterminateSpinner.jsx";
import {
  createResource,
  Suspense,
  type Component,
  type ParentProps,
} from "solid-js";
import styles from "./Layout.module.scss";
import trpc from "./lib/trpc";
import UKSideBar from "@tcsw/uikit-solid/src/components/sideBar/UKSideBar.tsx";
import SETTINGS_APPLICATIONS_ICON from "@material-symbols/svg-700/outlined/settings_applications.svg"
import APPS_ICON from "@material-symbols/svg-700/outlined/apps.svg"
import HOME_ICON from "@material-symbols/svg-700/outlined/home.svg"
import PERSON_ICON from "@material-symbols/svg-700/outlined/person.svg"
import PASSKEY_ICON from "@material-symbols/svg-700/outlined/passkey.svg"
import STORAGE_ICON from "@material-symbols/svg-700/outlined/storage.svg"
import WALLPAPER_ICON from "@material-symbols/svg-700/outlined/wallpaper.svg"

const Layout: Component<ParentProps> = (props) => {
  const [isAdministrator] = createResource(() =>
    trpc.instance.isUserAdministrator.query(),
  );
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <UKSideBar
      items={[
        {
          type: "label",
          label: "Settings",
        },
        {
          type: "button",
          icon: { type: "icon", value: HOME_ICON },
          label: "Overview",
          onClick() {
            navigate("/app/uk.tcsw.settings");
          },
          active: location.pathname === "/app/uk.tcsw.settings",
        },
        {
          type: "button",
          icon: { type: "icon", value: PERSON_ICON },
          label: "Profile",
          onClick() {
            navigate("/app/uk.tcsw.settings/profile");
          },
          active: location.pathname.startsWith("/app/uk.tcsw.settings/profile"),
        },
        {
          type: "button",
          icon: { type: "icon", value: PASSKEY_ICON },
          label: "Authentication",
          onClick() {
            navigate("/app/uk.tcsw.settings/authentication");
          },
          active: location.pathname.startsWith(
            "/app/uk.tcsw.settings/authentication",
          ),
        },
        {
          type: "button",
          icon: { type: "icon", value: STORAGE_ICON },
          label: "Storage",
          onClick() {
            navigate("/app/uk.tcsw.settings/storage");
          },
          active: location.pathname.startsWith("/app/uk.tcsw.settings/storage"),
        },
        {
          type: "button",
          icon: { type: "icon", value: WALLPAPER_ICON },
          label: "Customization",
          onClick() {
            navigate("/app/uk.tcsw.settings/customization");
          },
          active: location.pathname.startsWith(
            "/app/uk.tcsw.settings/customization",
          ),
        },
        {
          type: "button",
          icon: {type: "icon", value: APPS_ICON},
          label: "Applications",
          onClick() {
            navigate("/app/uk.tcsw.settings/applications");
          },
          active: location.pathname.startsWith(
            "/app/uk.tcsw.settings/applications",
          ),
        },
        isAdministrator()
          ? {
              type: "button",
            icon: {type: "icon", value: SETTINGS_APPLICATIONS_ICON},
              label: "Configure Instance",
              onClick() {
                navigate("/app/uk.tcsw.settings/instance");
              },
              active: location.pathname.startsWith(
                "/app/uk.tcsw.settings/instance",
              ),
            }
          : undefined,
      ]}
    >
      <Suspense fallback={<UKIndeterminateSpinner class={styles.spinner} />}>
        {props.children}
      </Suspense>
    </UKSideBar>
  );
};

export default Layout;
