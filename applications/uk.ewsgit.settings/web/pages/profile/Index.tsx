import CHEVRON_LEFT_ICON from "@material-symbols/svg-700/outlined/chevron_left.svg";
import LOGOUT_ICON from "@material-symbols/svg-700/outlined/logout.svg";
import UKAvatar from "@ewsgit/uikit-solid/src/components/avatar/UKAvatar.tsx";
import UKStack from "@ewsgit/uikit-solid/src/components/stack/UKStack.tsx";
import UKStackItem from "@ewsgit/uikit-solid/src/components/stack/UKStackItem.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import UKTopAppBar from "@ewsgit/uikit-solid/src/components/topAppBar/UKTopAppBar.jsx";
import useIsMobile from "@ewsgit/uikit-solid/src/core/useIsMobile.js";
import webInstanceTRPC from "@onlineworkspace/workspace-instance-web/src/lib/trpc.ts";
import { useNavigate } from "@solidjs/router";
import clsx from "clsx";
import { type Component, createResource, Suspense } from "solid-js";
import trpc from "../../lib/trpc";
import Bio from "./components/Bio/Bio.tsx";
import Email from "./components/Email/Email";
import Gender from "./components/Gender/Gender";
import Name from "./components/Name/Name";
import ProfilePicture from "./components/ProfilePicture/ProfilePicture";
import Username from "./components/Username/Username";
import styles from "./Index.module.scss";

const ProfilePage: Component = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [name, { refetch: refetchName, mutate: mutateName }] = createResource(() => trpc.profile.getName.query());
  const [role] = createResource(() => trpc.profile.getRole.query());
  const [avatar, { refetch: refetchAvatar }] = createResource(() => trpc.profile.getProfilePicture.query());

  return (
    <>
      <UKTopAppBar
        type="small"
        headline={"Profile"}
        leadingButton={{
          icon: CHEVRON_LEFT_ICON,
          onClick() {
            navigate("/app/uk.ewsgit.settings");
          },
          accessibleLabel: "Go back",
        }}
      />
      <Suspense>
        <div class={clsx(styles.root)}>
          <div class={styles.header}>
            <UKAvatar username="username" avatar={avatar() ? `${avatar()}?t=${Date.now()}` : "/assets/placeholder/avatar.png"} size="l" />
            <div>
              <UKText role="display" size="l" emphasized class={styles.fullName}>
                {name() || "Unknown"}
              </UKText>
              <UKText role="label" size="l" class={styles.permissionLevel}>
                {role() || "Unknown"}
              </UKText>
            </div>
          </div>
          <UKText class={styles.subheading} role="title" size="m" align="start">
            Basic info
          </UKText>
          <UKStack>
            <ProfilePicture refetchAvatar={refetchAvatar} />
            <Username />
            <Name name={name} mutateName={mutateName} refetchName={refetchName} />
            <Gender />
            <Bio />
          </UKStack>
          <UKText class={styles.subheading} role="title" size="m" align="start">
            Contact info
          </UKText>
          <UKStack>
            <Email />
          </UKStack>
          {isMobile() ? (
            <>
              <UKText class={styles.subheading} role="title" size="m" align="start">
                Session
              </UKText>
              <UKStack>
                <UKStackItem
                  labelText={"Logout"}
                  leading={{ type: "icon", value: LOGOUT_ICON }}
                  onClick={async () => {
                    await webInstanceTRPC.authorization.logout.mutate();
                    navigate("/");
                  }}
                />
              </UKStack>
            </>
          ) : null}
        </div>
      </Suspense>
    </>
  );
};

export default ProfilePage;
