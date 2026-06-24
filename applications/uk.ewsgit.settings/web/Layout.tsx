import APPS_ICON from "@material-symbols/svg-700/outlined/apps.svg";
import HOME_ICON from "@material-symbols/svg-700/outlined/home.svg";
import PASSKEY_ICON from "@material-symbols/svg-700/outlined/passkey.svg";
import PERSON_ICON from "@material-symbols/svg-700/outlined/person.svg";
import SETTINGS_APPLICATIONS_ICON from "@material-symbols/svg-700/outlined/settings_applications.svg";
import STORAGE_ICON from "@material-symbols/svg-700/outlined/storage.svg";
import WALLPAPER_ICON from "@material-symbols/svg-700/outlined/wallpaper.svg";
import UKCircularProgressIndicator from "@ewsgit/uikit-solid/src/components/circularProgressIndicator/UKCircularProgressIndicator.tsx";
import UKSideBar from "@ewsgit/uikit-solid/src/components/sideBar/UKSideBar.tsx";
import { useLocation, useNavigate, useSearchParams } from "@solidjs/router";
import {
  type Component,
  createEffect,
  createSignal,
  type ParentProps,
  Suspense,
} from "solid-js";
import { AppContext } from "./appContext";
import styles from "./Layout.module.scss";
import trpc from "./lib/trpc";

const Layout: Component<ParentProps> = (props) => {
  const [isAdministrator, setIsAdministrator] = createSignal<boolean>(false);
  const [shootYourselfInTheFoot, setShootYourselfInTheFoot] = createSignal<
    boolean
  >(false);
  const [searchParams] = useSearchParams();

  createEffect(async () => {
    setIsAdministrator(await trpc.instance.isUserAdministrator.query());
    setShootYourselfInTheFoot(
      await trpc.instance.hasFeature.query("shoot_yourself_in_the_foot"),
    );
  });

  const location = useLocation();
  const navigate = useNavigate();

  return (
    <AppContext.Provider
      value={{
        isAdministrator: isAdministrator,
        shootYourselfInTheFoot: shootYourselfInTheFoot,
        setShootYourselfInTheFoot: setShootYourselfInTheFoot,
      }}
    >
      {searchParams.sidebar_hidden === "true"
        ? (
          <div class={styles.sidebarHiddenPage}>
            <Suspense
              fallback={<UKCircularProgressIndicator class={styles.spinner} />}
            >
              {props.children}
            </Suspense>
          </div>
        )
        : (
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
                  navigate("/app/uk.ewsgit.settings");
                },
                active: location.pathname === "/app/uk.ewsgit.settings",
              },
              {
                type: "button",
                icon: { type: "icon", value: PERSON_ICON },
                label: "Profile",
                onClick() {
                  navigate("/app/uk.ewsgit.settings/profile");
                },
                active: location.pathname.startsWith(
                  "/app/uk.ewsgit.settings/profile",
                ),
              },
              {
                type: "button",
                icon: { type: "icon", value: PASSKEY_ICON },
                label: "Authentication",
                onClick() {
                  navigate("/app/uk.ewsgit.settings/authentication");
                },
                active: location.pathname.startsWith(
                  "/app/uk.ewsgit.settings/authentication",
                ),
              },
              {
                type: "button",
                icon: { type: "icon", value: STORAGE_ICON },
                label: "Storage",
                onClick() {
                  navigate("/app/uk.ewsgit.settings/storage");
                },
                active: location.pathname.startsWith(
                  "/app/uk.ewsgit.settings/storage",
                ),
              },
              {
                type: "button",
                icon: { type: "icon", value: WALLPAPER_ICON },
                label: "Customization",
                onClick() {
                  navigate("/app/uk.ewsgit.settings/customization");
                },
                active: location.pathname.startsWith(
                  "/app/uk.ewsgit.settings/customization",
                ),
              },
              {
                type: "button",
                icon: { type: "icon", value: APPS_ICON },
                label: "Applications",
                onClick() {
                  navigate("/app/uk.ewsgit.settings/applications");
                },
                active: location.pathname.startsWith(
                  "/app/uk.ewsgit.settings/applications",
                ),
              },
              ...isAdministrator()
                ? [
                  {
                    type: "divider" as const,
                  },
                  {
                    type: "label" as const,
                    label: "Manage Instance",
                  },
                  {
                    type: "button" as const,
                    icon: {
                      type: "icon" as const,
                      value: SETTINGS_APPLICATIONS_ICON,
                    },
                    label: "Configure Instance",
                    onClick() {
                      navigate("/app/uk.ewsgit.settings/instance");
                    },
                    active: location.pathname.startsWith(
                      "/app/uk.ewsgit.settings/instance",
                    ),
                  },
                ]
                : [],
            ]}
          >
            <Suspense
              fallback={<UKCircularProgressIndicator class={styles.spinner} />}
            >
              {props.children}
            </Suspense>
          </UKSideBar>
        )}
    </AppContext.Provider>
  );
};

export default Layout;
