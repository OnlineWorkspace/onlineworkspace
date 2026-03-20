import { useNavigate } from "@solidjs/router";
import UKAvatar from "@tcsw/uikit-solid/src/components/avatar/UKAvatar.tsx";
import UKStack from "@tcsw/uikit-solid/src/components/stack/UKStack.tsx";
import UKStackItem from "@tcsw/uikit-solid/src/components/stack/UKStackItem.tsx";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.tsx";
import UKTopAppBar from "@tcsw/uikit-solid/src/components/topAppBar/UKTopAppBar.jsx";
import useIsMobile from "@tcsw/uikit-solid/src/core/useIsMobile.js";
import webInstanceTRPC from "@tcsw/workspaces-instance-web/src/lib/trpc.ts";
import { type Component, createResource } from "solid-js";
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
  const [name, { refetch: refetchName }] = createResource(() => trpc.profile.getName.query());
  const [role] = createResource(() => trpc.profile.getRole.query());
  const [avatar, { refetch: refetchAvatar }] = createResource(() =>
    trpc.profile.getProfilePicture.query(),
  );

  return (
    <>
      <UKTopAppBar
        type="small"
        headline={"Profile"}
        leadingButton={{
          icon: "chevron_left",
          onClick() {
            navigate("/app/uk.tcsw.settings");
          },
          accessibleLabel: "Go back",
        }}
      />
      <div class={styles.root}>
        <div class={styles.header}>
          <UKAvatar
            username="username"
            avatar={avatar() ? `${avatar()}?t=${Date.now()}` : "/assets/placeholder/avatar.png"}
            size="l"
          />
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
          <Name refetchName={refetchName} />
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
                leading={{ type: "icon", value: "logout" }}
                onClick={async () => {
                  await webInstanceTRPC.authorization.logout.mutate();
                  navigate("/");
                }}
              />
            </UKStack>
          </>
        ) : null}
      </div>
    </>
  );
};

export default ProfilePage;
