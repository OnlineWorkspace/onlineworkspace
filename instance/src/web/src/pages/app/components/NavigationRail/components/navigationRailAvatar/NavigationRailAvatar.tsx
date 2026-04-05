import LOGOUT_ICON from "@material-symbols/svg-700/outlined/logout.svg";
import { useNavigate } from "@solidjs/router";
import UKAvatar from "@tcsw/uikit-solid/src/components/avatar/UKAvatar.jsx";
import UKIconButton from "@tcsw/uikit-solid/src/components/iconButton/UKIconButton.tsx";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.jsx";
import useIsMobile from "@tcsw/uikit-solid/src/core/useIsMobile.ts";
import { type Component, createResource, Show } from "solid-js";
import backend from "../../../../../../lib/backend";
import trpc from "../../../../../../lib/trpc";
import styles from "./NavigationRailAvatar.module.scss";

const NavigationRailAvatar: Component<{ expanded: boolean }> = (props) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [user] = createResource(() => trpc.app.navigation.user.name.query());

  return (
    <div class={styles.root} data-expanded={props.expanded}>
      <UKAvatar
        onClick={() => {
          navigate("/app/uk.tcsw.settings/profile");
        }}
        class={styles.avatar}
        avatar={backend("/api/user/me/avatar/s")}
        size="s"
        username="me"
      />
      <Show when={!isMobile()}>
        <div class={styles.nameContainer}>
          <UKText size="m" role="title" class={styles.displayName}>
            {`${user()?.forename} ${user()?.surname}`}
          </UKText>
          <UKText size="m" role="label">
            {`@${user()?.username}`}
          </UKText>
        </div>
        <UKIconButton
          class={styles.logout}
          icon={LOGOUT_ICON}
          alt={"Logout"}
          color={"filled"}
          shape={"round"}
          size={"s"}
          width={"default"}
          onClick={async () => {
            await trpc.authorization.logout.mutate();

            navigate("/");
          }}
        />
      </Show>
    </div>
  );
};

export default NavigationRailAvatar;
