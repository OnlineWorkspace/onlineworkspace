import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import { useNavigate } from "@solidjs/router";
import { type Component, createResource, Show } from "solid-js";
import trpc from "../../../../lib/trpc";
import ApplicationIcon from "../../../../components/ApplicationIcon/ApplicationIcon";
import styles from "./ApplicationTile.module.scss";

/** A compact application entry: icon, name and a short description. */
const ApplicationTile: Component<{ repository: string; applicationId: string }> = (props) => {
  const [app] = createResource(() => trpc.search.getResult.query({ applicationId: props.applicationId, repository: props.repository }));
  const navigate = useNavigate();

  return (
    // directories that aren't applications resolve to nothing, so they take up no space
    <Show when={app.loading || app()}>
      <UKCard
        color="filled"
        class={styles.root}
        data-loading={app.loading}
        onClick={() => navigate(`/app/uk.ewsgit.store/app/${props.repository}/${props.applicationId}`)}
      >
        <ApplicationIcon icon={app()?.icon} size="m" />
        <div class={styles.text}>
          <UKText role="title" size="m" emphasized align="start" class={styles.title}>
            {app()?.displayName}
          </UKText>
          <UKText role="body" size="s" align="start" class={styles.description}>
            {app()?.description}
          </UKText>
        </div>
        <Show when={app()?.isInstalled}>
          <UKText role="label" size="s" class={styles.installed}>
            Installed
          </UKText>
        </Show>
      </UKCard>
    </Show>
  );
};

export default ApplicationTile;
