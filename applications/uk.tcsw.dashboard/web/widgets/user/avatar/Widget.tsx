import UKAvatar from "@tcsw/uikit-solid/src/components/avatar/UKAvatar.jsx";
import UKCard from "@tcsw/uikit-solid/src/components/card/UKCard.jsx";
import { type Component, createResource } from "solid-js";
import trpc from "../../../lib/trpc";
import styles from "./Widget.module.scss";

const Widget: Component = (props) => {
  const [userData] = createResource(() => trpc.dashboard.widgets.user.avatar.query());

  return (
    <div {...props} class={styles.root}>
      <UKCard class={styles.card}>
        <UKAvatar class={styles.avatar} avatar={userData() || "/assets/placeholder/avatar.png"} size="2xl" username="username" />
      </UKCard>
    </div>
  );
};

export default Widget;
