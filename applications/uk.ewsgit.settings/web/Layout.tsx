import APPS_ICON from "@material-symbols/svg-700/outlined/apps.svg";
import APPS_FILL_ICON from "@material-symbols/svg-700/outlined/apps-fill.svg";
import BRAND_FAMILY_ICON from "@material-symbols/svg-700/outlined/brand_family.svg";
import BRAND_FAMILY_FILL_ICON from "@material-symbols/svg-700/outlined/brand_family-fill.svg";
import TOGGLE_ON_ICON from "@material-symbols/svg-700/outlined/toggle_on.svg";
import TOGGLE_ON_FILL_ICON from "@material-symbols/svg-700/outlined/toggle_on-fill.svg";
import DEPLOYED_CODE_ICON from "@material-symbols/svg-700/outlined/deployed_code.svg";
import DEPLOYED_CODE_FILL_ICON from "@material-symbols/svg-700/outlined/deployed_code-fill.svg";
import MAIL_ICON from "@material-symbols/svg-700/outlined/mail.svg";
import MAIL_FILL_ICON from "@material-symbols/svg-700/outlined/mail-fill.svg";
import GROUP_ICON from "@material-symbols/svg-700/outlined/group.svg";
import GROUP_FILL_ICON from "@material-symbols/svg-700/outlined/group-fill.svg";
import HOME_ICON from "@material-symbols/svg-700/outlined/home.svg";
import HOME_FILL_ICON from "@material-symbols/svg-700/outlined/home-fill.svg";
import PASSKEY_ICON from "@material-symbols/svg-700/outlined/passkey.svg";
import PASSKEY_FILL_ICON from "@material-symbols/svg-700/outlined/passkey-fill.svg";
import PERSON_ICON from "@material-symbols/svg-700/outlined/person.svg";
import PERSON_FILL_ICON from "@material-symbols/svg-700/outlined/person-fill.svg";
import SETTINGS_ICON from "@material-symbols/svg-700/outlined/settings.svg";
import STORAGE_ICON from "@material-symbols/svg-700/outlined/storage.svg";
import STORAGE_FILL_ICON from "@material-symbols/svg-700/outlined/storage-fill.svg";
import WALLPAPER_ICON from "@material-symbols/svg-700/outlined/wallpaper.svg";
import WALLPAPER_FILL_ICON from "@material-symbols/svg-700/outlined/wallpaper-fill.svg";
import UKCircularProgressIndicator from "@ewsgit/uikit-solid/src/components/circularProgressIndicator/UKCircularProgressIndicator.tsx";
import UKIcon from "@ewsgit/uikit-solid/src/components/icon/UKIcon.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import UKSideBar from "@ewsgit/uikit-solid/src/components/sideBar/UKSideBar.tsx";
import {useLocation, useNavigate, useSearchParams} from "@solidjs/router";
import {
  type Component,
  createEffect,
  createSignal,
  type ParentProps,
  Suspense,
} from "solid-js";
import {AppContext} from "./appContext";
import styles from "./Layout.module.scss";
import trpc from "./lib/trpc";
import {MetaProvider, Title} from "@solidjs/meta";

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

  const inSection = (section: string) => location.pathname.startsWith(`/app/uk.ewsgit.settings/${section}`);

  const brandHeader = () => (
    <div class={styles.brand}>
      <div class={styles.brandIcon}>
        <UKIcon>{SETTINGS_ICON}</UKIcon>
      </div>
      <UKText role="title" size="l">
        Settings
      </UKText>
    </div>
  );

  return (
    <>
      <MetaProvider>
        <Title>Settings</Title>
      </MetaProvider>
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
                fallback={<UKCircularProgressIndicator class={styles.spinner}/>}
              >
                {props.children}
              </Suspense>
            </div>
          )
          : (
            <UKSideBar
              items={[
                {type: "component", component: brandHeader},
                {
                  type: "button",
                  icon: {type: "icon", value: location.pathname === "/app/uk.ewsgit.settings" ? HOME_FILL_ICON : HOME_ICON},
                  label: "Overview",
                  onClick() {
                    navigate("/app/uk.ewsgit.settings");
                  },
                  active: location.pathname === "/app/uk.ewsgit.settings",
                },
                {
                  type: "button",
                  icon: {type: "icon", value: inSection("profile") ? PERSON_FILL_ICON : PERSON_ICON},
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
                  icon: {type: "icon", value: inSection("authentication") ? PASSKEY_FILL_ICON : PASSKEY_ICON},
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
                  icon: {type: "icon", value: inSection("storage") ? STORAGE_FILL_ICON : STORAGE_ICON},
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
                  icon: {type: "icon", value: inSection("customization") ? WALLPAPER_FILL_ICON : WALLPAPER_ICON},
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
                  icon: {type: "icon", value: inSection("applications") ? APPS_FILL_ICON : APPS_ICON},
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
                      label: "INSTANCE",
                    },
                    {
                      type: "button" as const,
                      icon: {
                        type: "icon" as const,
                        value: location.pathname === "/app/uk.ewsgit.settings/instance/branding" ? BRAND_FAMILY_FILL_ICON : BRAND_FAMILY_ICON,
                      },
                      label: "Branding",
                      onClick() {
                        navigate("/app/uk.ewsgit.settings/instance/branding");
                      },
                      active: location.pathname === "/app/uk.ewsgit.settings/instance/branding",
                    },
                    {
                      type: "button" as const,
                      icon: {
                        type: "icon" as const,
                        value: location.pathname === "/app/uk.ewsgit.settings/instance/features" ? TOGGLE_ON_FILL_ICON : TOGGLE_ON_ICON,
                      },
                      label: "Features",
                      onClick() {
                        navigate("/app/uk.ewsgit.settings/instance/features");
                      },
                      active: location.pathname === "/app/uk.ewsgit.settings/instance/features",
                    },
                    {
                      type: "button" as const,
                      icon: {
                        type: "icon" as const,
                        value: location.pathname === "/app/uk.ewsgit.settings/instance/installed_applications" ? DEPLOYED_CODE_FILL_ICON : DEPLOYED_CODE_ICON,
                      },
                      label: "Installed Applications",
                      onClick() {
                        navigate("/app/uk.ewsgit.settings/instance/installed_applications");
                      },
                      active: location.pathname === "/app/uk.ewsgit.settings/instance/installed_applications",
                    },
                    {
                      type: "button" as const,
                      icon: {
                        type: "icon" as const,
                        value: location.pathname === "/app/uk.ewsgit.settings/instance/mailserver" ? MAIL_FILL_ICON : MAIL_ICON,
                      },
                      label: "Mailserver",
                      onClick() {
                        navigate("/app/uk.ewsgit.settings/instance/mailserver");
                      },
                      active: location.pathname === "/app/uk.ewsgit.settings/instance/mailserver",
                    },
                    {
                      type: "button" as const,
                      icon: {
                        type: "icon" as const,
                        value: location.pathname === "/app/uk.ewsgit.settings/instance/users" ? GROUP_FILL_ICON : GROUP_ICON,
                      },
                      label: "Users",
                      onClick() {
                        navigate("/app/uk.ewsgit.settings/instance/users");
                      },
                      active: location.pathname === "/app/uk.ewsgit.settings/instance/users",
                    },
                  ]
                  : [],
              ]}
            >
              <Suspense
                fallback={<UKCircularProgressIndicator class={styles.spinner}/>}
              >
                {props.children}
              </Suspense>
            </UKSideBar>
          )}
      </AppContext.Provider>
    </>
  );
};

export default Layout;
