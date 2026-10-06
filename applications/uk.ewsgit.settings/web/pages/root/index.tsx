import UPDATE_ICON from "@material-symbols/svg-700/outlined/update.svg";
import BACKUP_ICON from "@material-symbols/svg-700/outlined/backup.svg";
import HISTORY_ICON from "@material-symbols/svg-700/outlined/history.svg";
import BRAND_FAMILY_ICON from "@material-symbols/svg-700/outlined/brand_family.svg";
import DEPLOYED_CODE_ICON from "@material-symbols/svg-700/outlined/deployed_code.svg";
import GROUP_ICON from "@material-symbols/svg-700/outlined/group.svg";
import MAIL_ICON from "@material-symbols/svg-700/outlined/mail.svg";
import TOGGLE_ON_ICON from "@material-symbols/svg-700/outlined/toggle_on.svg";
import APPS_ICON from "@material-symbols/svg-700/outlined/apps.svg";
import KEY_ICON from "@material-symbols/svg-700/outlined/key.svg";
import LOGOUT_ICON from "@material-symbols/svg-700/outlined/logout.svg";
import PASSKEY_ICON from "@material-symbols/svg-700/outlined/passkey.svg";
import PERSON_ICON from "@material-symbols/svg-700/outlined/person.svg";
import STORAGE_ICON from "@material-symbols/svg-700/outlined/storage.svg";
import WALLPAPER_ICON from "@material-symbols/svg-700/outlined/wallpaper.svg";
import UKAvatar from "@ewsgit/uikit-solid/src/components/avatar/UKAvatar.tsx";
import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import { DividerDirection } from "@ewsgit/uikit-solid/src/components/divider/lib/direction.ts";
import UKDivider from "@ewsgit/uikit-solid/src/components/divider/UKDivider.tsx";
import UKStack from "@ewsgit/uikit-solid/src/components/stack/UKStack.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import webInstanceTRPC from "@onlineworkspace/workspace-web/src/lib/trpc.ts";
import { useNavigate } from "@solidjs/router";
import clsx from "clsx";
import { type Component, createResource, Suspense } from "solid-js";
import trpc from "../../lib/trpc";
import Shortcut from "./component/Shortcut/Shortcut";
import styles from "./index.module.scss";
import UKStackLabel from "@ewsgit/uikit-solid/src/components/stack/UKStackLabel.tsx";

const RootPage: Component = () => {
  const navigate = useNavigate();
  const [user] = createResource(() => trpc.overview.user.query());

  return (
    <>
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
              <UKAvatar
                username="username"
                avatar={user()?.avatar || "/assets/placeholder/avatar.png"}
                size="l"
              />
              <div>
                <UKText
                  role="display"
                  size="l"
                  emphasized
                  class={styles.fullName}
                >
                  {user()?.fullName || "Unknown"}
                </UKText>
                <UKText role="label" size="l" class={styles.permissionLevel}>
                  @{user()?.username || "Unknown"}
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
              <UKButton
                color="tonal"
                leadingIcon={KEY_ICON}
                onClick={() =>
                  navigate(
                    "/app/uk.ewsgit.settings/authentication/?change-passsword=true",
                  )}
              >
                Change Password
              </UKButton>
            </div>
            <UKDivider
              class={styles.divider}
              direction={DividerDirection.horizontal}
              width="middle-inset"
            />
            <UKStack>
              <Shortcut
                title="Profile"
                description="View & Manage your profile"
                icon={PERSON_ICON}
                path="/app/uk.ewsgit.settings/profile"
              />
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
              <Shortcut
                title="Applications"
                description="Manage application settings"
                icon={APPS_ICON}
                path="/app/uk.ewsgit.settings/applications"
              />
            </UKStack>
            {user()?.isAdministrator && (
              <>
                <UKStackLabel>Manage Instance</UKStackLabel>
                <UKStack>
                  <Shortcut
                    title="Instance Branding"
                    description=""
                    icon={BRAND_FAMILY_ICON}
                    path="/app/uk.ewsgit.settings/instance/branding"
                  />
                  <Shortcut
                    title="Configure Features"
                    description=""
                    icon={TOGGLE_ON_ICON}
                    path="/app/uk.ewsgit.settings/instance/features"
                  />
                  <Shortcut
                    title="Manage Installed Applications"
                    description=""
                    icon={DEPLOYED_CODE_ICON}
                    path="/app/uk.ewsgit.settings/instance/installed_applications"
                  />
                  <Shortcut
                    title="Configure Mailserver"
                    description=""
                    icon={MAIL_ICON}
                    path="/app/uk.ewsgit.settings/instance/mailserver"
                  />
                  <Shortcut
                    title="Manage Users"
                    description=""
                    icon={GROUP_ICON}
                    path="/app/uk.ewsgit.settings/instance/users"
                  />
                  <Shortcut
                    title="Backups"
                    description=""
                    icon={BACKUP_ICON}
                    path="/app/uk.ewsgit.settings/instance/backups"
                  />
                  <Shortcut
                    title="Updates"
                    description=""
                    icon={UPDATE_ICON}
                    path="/app/uk.ewsgit.settings/instance/updates"
                  />
                  <Shortcut
                    title="Audit Log"
                    description=""
                    icon={HISTORY_ICON}
                    path="/app/uk.ewsgit.settings/instance/audit"
                  />
                </UKStack>
              </>
            )}
          </div>
        </div>
      </Suspense>
    </>
  );
};

export default RootPage;
