import UKAvatar from "@tcsw/uikit-solid/src/components/avatar/UKAvatar.jsx";
import UKCard from "@tcsw/uikit-solid/src/components/card/UKCard.jsx";
import { createResource, type Component } from "solid-js";
import styles from "./Widget.module.scss";
import trpc from "../../../lib/trpc";

const Widget: Component = () => {
  const [userData] = createResource(() =>
    trpc.dashboard.widgets.user.avatar.query(),
  );

  return (
    <UKCard class={styles.root}>
      <UKAvatar
        class={styles.avatar}
        avatar={userData() || "/assets/placeholder/avatar.png"}
        size="2xl"
        username="username"
      />
    </UKCard>
  );
};

export default Widget;
