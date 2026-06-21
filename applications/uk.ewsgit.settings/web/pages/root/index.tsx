import APPS_ICON from "@material-symbols/svg-700/outlined/apps.svg";
import KEY_ICON from "@material-symbols/svg-700/outlined/key.svg";
import LOGOUT_ICON from "@material-symbols/svg-700/outlined/logout.svg";
import PASSKEY_ICON from "@material-symbols/svg-700/outlined/passkey.svg";
import PERSON_ICON from "@material-symbols/svg-700/outlined/person.svg";
import SETTINGS_APPLICATIONS_ICON from "@material-symbols/svg-700/outlined/settings_applications.svg";
import STORAGE_ICON from "@material-symbols/svg-700/outlined/storage.svg";
import WALLPAPER_ICON from "@material-symbols/svg-700/outlined/wallpaper.svg";
import UKAvatar from "@ewsgit/uikit-solid/src/components/avatar/UKAvatar.tsx";
import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import { DividerDirection } from "@ewsgit/uikit-solid/src/components/divider/lib/direction.ts";
import UKDivider from "@ewsgit/uikit-solid/src/components/divider/UKDivider.tsx";
import UKStack from "@ewsgit/uikit-solid/src/components/stack/UKStack.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import UKTopAppBar from "@ewsgit/uikit-solid/src/components/topAppBar/UKTopAppBar.tsx";
import webInstanceTRPC from "@onlineworkspace/workspace-instance-web/src/lib/trpc.ts";
import { useNavigate } from "@solidjs/router";
import clsx from "clsx";
import { type Component, createResource, Suspense } from "solid-js";
import trpc from "../../lib/trpc";
import Shortcut from "./component/Shortcut/Shortcut";
import styles from "./index.module.scss";

const RootPage: Component = () => {
  const navigate = useNavigate();
  const [fullName] = createResource(() => trpc.overview.user.fullName.query());
  const [role] = createResource(() => trpc.overview.user.role.query());
  const [avatar] = createResource(() => trpc.overview.user.getAvatar.query());

  return (
    <>
      <UKTopAppBar type="small" headline={"Overview"} />
      <Suspense>
        <div class={styles.root}>
          <div class={clsx(styles.content)}>
            <button
              type="button"
              class={styles.header}
              onClick={() => {
                navigate("/app/uk.ewsgit.settings/profile");
              }}
            >
              <UKAvatar username="username" avatar={avatar() || "/assets/placeholder/avatar.png"} size="l" />
              <div>
                <UKText role="display" size="l" emphasized class={styles.fullName}>
                  {fullName() || "Unknown"}
                </UKText>
                <UKText role="label" size="l" class={styles.permissionLevel}>
                  {role() || "Unknown"}
                </UKText>
              </div>
            </button>
            <div class={styles.quickActions}>
              <UKButton
                color="tonal"
                leadingIcon={LOGOUT_ICON}
                onClick={async () => {
                  await webInstanceTRPC.authorization.logout.mutate();
                  navigate("/");
                }}
              >
                Logout
              </UKButton>
              <UKButton color="tonal" leadingIcon={KEY_ICON} onClick={() => navigate("/app/uk.ewsgit.settings/authentication/?change-passsword=true")}>
                Change Password
              </UKButton>
            </div>
            <UKDivider class={styles.divider} direction={DividerDirection.horizontal} width="middle-inset" />
            <UKStack>
              <Shortcut title="Profile" description="View & Manage your profile" icon={PERSON_ICON} path="/app/uk.ewsgit.settings/profile" />
              <Shortcut
                title="Authentication"
                description="View & Manage your login sessions & credentials"
                icon={PASSKEY_ICON}
                path="/app/uk.ewsgit.settings/authentication"
              />
              <Shortcut
                title="Storage"
                description="Visualise storage usage & clean up duplicates"
                icon={STORAGE_ICON}
                path="/app/uk.ewsgit.settings/storage"
              />
              <Shortcut
                title="Customization"
                description="Choose a wallpaper and color theme"
                icon={WALLPAPER_ICON}
                path="/app/uk.ewsgit.settings/customization"
              />
              <Shortcut title="Applications" description="Manage application settings" icon={APPS_ICON} path="/app/uk.ewsgit.settings/applications" />
              {role() === "Administrator" && (
                <Shortcut
                  title="Configure Instance"
                  description="(ADMINISTRATORS ONLY) Manage the instance & it’s users"
                  icon={SETTINGS_APPLICATIONS_ICON}
                  path="/app/uk.ewsgit.settings/instance"
                />
              )}
            </UKStack>
          </div>
        </div>
      </Suspense>
    </>
  );
};

export default RootPage;
