import UKAvatar from "@onlineworkspace/uikit-solid/src/components/avatar/UKAvatar.jsx";
import UKCard from "@onlineworkspace/uikit-solid/src/components/card/UKCard.jsx";
import UKText from "@onlineworkspace/uikit-solid/src/components/text/UKText.jsx";
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
