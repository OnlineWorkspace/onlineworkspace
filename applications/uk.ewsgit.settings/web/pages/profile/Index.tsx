import CHEVRON_LEFT_ICON from "@material-symbols/svg-700/outlined/chevron_left.svg";
import LOGOUT_ICON from "@material-symbols/svg-700/outlined/logout.svg";
import UKAvatar from "@ewsgit/uikit-solid/src/components/avatar/UKAvatar.tsx";
import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import UKTopAppBar from "@ewsgit/uikit-solid/src/components/topAppBar/UKTopAppBar.tsx";
import useIsMobile from "@ewsgit/uikit-solid/src/core/useIsMobile.js";
import webInstanceTRPC from "@onlineworkspace/workspace-web/src/lib/trpc.ts";
import { useNavigate } from "@solidjs/router";
import { type Component, createResource, Show, Suspense } from "solid-js";
import baseSettingsPageStyles from "../../BaseSettingsPage.module.scss";
import trpc from "../../lib/trpc";
import EmailCard from "./components/EmailCard/EmailCard.tsx";
import ProfileForm from "./components/ProfileForm/ProfileForm.tsx";
import ProfilePicture from "./components/ProfilePicture/ProfilePicture";
import styles from "./Index.module.scss";

const ProfilePage: Component = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [name, { mutate: mutateName }] = createResource(() => trpc.profile.getName.query());
  const [username, { mutate: mutateUsername }] = createResource(() => trpc.profile.getUsername.query());
  const [details] = createResource(async () => {
    const [displayName, username, gender, pronouns, bio] = await Promise.all([
      trpc.profile.getName.query(),
      trpc.profile.getUsername.query(),
      trpc.profile.getGender.query(),
      trpc.profile.getPronouns.query(),
      trpc.profile.getBio.query(),
    ]);

    return { displayName, username, gender, pronouns, bio };
  });
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
      <div class={baseSettingsPageStyles.baseSettingsPageContent}>
        <Suspense>
          <div class={styles.page}>
            <UKCard class={styles.hero} color="filled">
              <div class={styles.heroBody}>
                <div class={styles.avatar}>
                  <UKAvatar username={username() || "unknown"} avatar={avatar() ? `${avatar()}?t=${Date.now()}` : "/assets/placeholder/avatar.png"} size="l" />
                </div>
                <div class={styles.identity}>
                  <UKText role="headline" size="l" emphasized align="start" class={styles.displayName}>
                    {name() || "Unknown"}
                  </UKText>
                  <UKText role="label" size="l" align="start" class={styles.username}>
                    @{username() || "unknown"}
                  </UKText>
                </div>
                <ProfilePicture refetchAvatar={refetchAvatar} />
              </div>
            </UKCard>
            <Show when={details.state === "ready" && details()}>
              {(initial) => (
                <ProfileForm
                  initial={initial()}
                  onSaved={(values) => {
                    mutateName(values.displayName);
                    mutateUsername(values.username);
                  }}
                />
              )}
            </Show>
            <EmailCard />
            <Show when={isMobile()}>
              <div class={styles.session}>
                <UKButton
                  color="tonal"
                  leadingIcon={LOGOUT_ICON}
                  onClick={async () => {
                    await webInstanceTRPC.authorization.logout.mutate();
                    navigate("/");
                  }}
                >
                  Log out
                </UKButton>
              </div>
            </Show>
          </div>
        </Suspense>
      </div>
    </>
  );
};

export default ProfilePage;
