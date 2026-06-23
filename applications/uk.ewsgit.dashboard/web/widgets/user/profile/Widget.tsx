import UKAvatar from "@ewsgit/uikit-solid/src/components/avatar/UKAvatar.tsx";
import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import { type Component, createResource } from "solid-js";
import trpc from "../../../lib/trpc";
import styles from "./Widget.module.scss";

const Widget: Component = () => {
  const [userData] = createResource(() => trpc.dashboard.widgets.user.profile.query());

  return (
    <UKCard class={styles.root}>
      <UKAvatar avatar={userData()?.avatar || "/assets/placeholder/avatar.png"} size="m" username="username" />
      <div>
        <UKText role="title" align="start" emphasized size="l">
          {userData()?.displayName || "Unknown"}
        </UKText>
        <UKText role="label" align="start" size="s">
          {`@${userData()?.username || "Unknown"}`}
        </UKText>
      </div>
    </UKCard>
  );
};

export default Widget;
