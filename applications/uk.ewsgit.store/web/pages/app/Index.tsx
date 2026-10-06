import CHEVRON_LEFT_ICON from "@material-symbols/svg-700/outlined/chevron_left.svg";
import DELETE_ICON from "@material-symbols/svg-700/outlined/delete.svg";
import DOWNLOAD_ICON from "@material-symbols/svg-700/outlined/download.svg";
import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.tsx";
import ApplicationIcon from "../../components/ApplicationIcon/ApplicationIcon";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import { useNavigate, useParams, useSearchParams } from "@solidjs/router";
import { type Component, createResource, For, type JSX, Show } from "solid-js";
import trpc from "../../lib/trpc";
import styles from "./Index.module.scss";

const Detail: Component<{ label: string; children: JSX.Element }> = (props) => (
  <div class={styles.detail}>
    <UKText role="label" size="m" align="start" class={styles.detailLabel}>
      {props.label}
    </UKText>
    <UKText role="body" size="m" align="start">
      {props.children}
    </UKText>
  </div>
);

const ApplicationPage: Component = () => {
  const { applicationId, repository } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [application] = createResource(() =>
    trpc.app.get.query({
      applicationId: applicationId!,
      repository: repository!,
    })
  );

  const toggleInstall = async () => {
    const app = application();
    if (!app) return;

    if (app.isInstalled) {
      await trpc.app.uninstall.mutate({ applicationId: app.id });
    } else {
      await trpc.app.install.mutate({
        applicationId: app.id,
        repository: repository || "local",
      });
    }
    window.location.reload();
  };

  return (
    <div class={styles.root}>
      <UKButton
        class={styles.backButton}
        leadingIcon={CHEVRON_LEFT_ICON}
        color="tonal"
        onClick={() => navigate(searchParams.origin?.toString() ?? "../../../")}
      >
        Back
      </UKButton>
      <div class={styles.header}>
        <img
          alt=""
          class={styles.headerImage}
          src={application()?.bannerImage || "/assets/placeholder/placeholder_image.svg"}
        />
      </div>
      <div class={styles.headerContent}>
        <ApplicationIcon icon={application()?.icon} size="l" />
        <UKText role="display" size="m">
          {application()?.displayName}
        </UKText>
        <UKButton
          disabled={!application()?.isUserAdministrator || !application()?.canBeUninstalled}
          class={styles.headerContentButton}
          leadingIcon={application()?.isInstalled ? DELETE_ICON : DOWNLOAD_ICON}
          onClick={toggleInstall}
        >
          {application()?.isInstalled ? "Uninstall" : "Install"}
        </UKButton>
      </div>

      <div class={styles.body}>
        <Show
          when={application()?.isUserAdministrator}
          fallback={
            <UKCard color="elevated" class={styles.notice}>
              <UKText role="body" size="l" align="start">
                You are not an administrator and lack the permission to install or uninstall applications.
              </UKText>
            </UKCard>
          }
        >
          <Show when={application() && !application()?.canBeUninstalled}>
            <UKCard color="elevated" class={styles.notice}>
              <UKText role="body" size="l" align="start">
                This application is bundled with Online Workspace and cannot be uninstalled without enabling the
                "shoot_yourself_in_the_foot" feature.
              </UKText>
            </UKCard>
          </Show>
        </Show>

        <div class={styles.columns}>
          <section class={styles.about}>
            <UKText role="title" size="l" align="start">
              About
            </UKText>
            <UKText role="body" size="l" align="start" class={styles.description}>
              {application()?.description}
            </UKText>
          </section>

          <UKCard color="filled" class={styles.details}>
            <UKText role="title" size="m" align="start">
              Details
            </UKText>
            <Detail label="Storage required">{Math.ceil((application()?.installSize ?? 0) / 1000)}KB</Detail>
            <Show when={application()?.graphicsAcceleration}>
              <Detail label="Graphics acceleration">{application()?.graphicsAcceleration}</Detail>
            </Show>
            <Show when={(application()?.permissions || []).length > 0}>
              <Detail label="Permissions">{application()?.permissions?.join(", ")}</Detail>
            </Show>
            <Show when={application()?.authors?.length}>
              <Detail label="Created by">
                <For each={application()?.authors}>{(author) => <div>{author.name}</div>}</For>
              </Detail>
            </Show>
            <Detail label="Repository">{repository}</Detail>
            <Detail label="Application ID">{application()?.id}</Detail>
          </UKCard>
        </div>
      </div>
    </div>
  );
};

export default ApplicationPage;
