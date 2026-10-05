import ARROW_FORWARD_ICON from "@material-symbols/svg-700/outlined/arrow_forward.svg";
import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import { useNavigate } from "@solidjs/router";
import { type Component, createResource, Show } from "solid-js";
import trpc from "../../../../lib/trpc";
import ApplicationIcon from "../../../../components/ApplicationIcon/ApplicationIcon";
import styles from "./FeaturedApplication.module.scss";

/** The large banner at the top of the store for the most prominent application. */
const FeaturedApplication: Component<{ repository: string; applicationId: string }> = (props) => {
  const [app] = createResource(() => trpc.search.getResult.query({ applicationId: props.applicationId, repository: props.repository }));
  const navigate = useNavigate();
  const open = () => navigate(`/app/uk.ewsgit.store/app/${props.repository}/${props.applicationId}`);

  return (
    <section class={styles.root} aria-label="Featured application" data-loading={app.loading}>
      <img alt="" class={styles.banner} draggable={false} src={app()?.bannerImage || "/assets/generic_background.svg"} />
      <div class={styles.scrim} />
      <div class={styles.content}>
        <ApplicationIcon icon={app()?.icon} size="l" />
        <div class={styles.text}>
          <UKText role="label" size="l" class={styles.eyebrow}>
            Featured{app()?.isInstalled ? " · Installed" : ""}
          </UKText>
          <UKText role="display" size="s" emphasized align="start">
            {app()?.displayName}
          </UKText>
          <UKText role="body" size="l" align="start" class={styles.description}>
            {app()?.description}
          </UKText>
          <Show when={app()?.authors.length}>
            <UKText role="label" size="m" align="start" class={styles.authors}>
              {app()?.authors.map((a) => a.name).join(" & ")}
            </UKText>
          </Show>
        </div>
        <UKButton class={styles.action} color="filled" trailingIcon={ARROW_FORWARD_ICON} onClick={open}>
          {app()?.isInstalled ? "View" : "Get"}
        </UKButton>
      </div>
    </section>
  );
};

export default FeaturedApplication;
