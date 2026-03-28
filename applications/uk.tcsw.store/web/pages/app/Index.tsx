import CHEVRON_LEFT_ICON from "@material-symbols/svg-700/outlined/chevron_left.svg";
import DELETE_ICON from "@material-symbols/svg-700/outlined/delete.svg";
import DOWNLOAD_ICON from "@material-symbols/svg-700/outlined/download.svg";
import { useNavigate, useParams, useSearchParams } from "@solidjs/router";
import UKButton from "@tcsw/uikit-solid/src/components/button/UKButton.jsx";
import UKCard from "@tcsw/uikit-solid/src/components/card/UKCard.jsx";
import { DividerDirection } from "@tcsw/uikit-solid/src/components/divider/lib/direction.js";
import UKDivider from "@tcsw/uikit-solid/src/components/divider/UKDivider.jsx";
import UKIcon from "@tcsw/uikit-solid/src/components/icon/UKIcon.jsx";
import UKStack from "@tcsw/uikit-solid/src/components/stack/UKStack.jsx";
import UKStackItem from "@tcsw/uikit-solid/src/components/stack/UKStackItem.jsx";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.jsx";
import { type Component, createResource, For } from "solid-js";
import trpc from "../../lib/trpc";
import styles from "./Index.module.scss";

const ApplicationPage: Component = () => {
  const { applicationId, repository } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [application] = createResource(() => trpc.app.get.query({ applicationId: applicationId!, repository: repository! }));

  return (
    <div class={styles.root}>
      <UKButton
        class={styles.backButton}
        leadingIcon={CHEVRON_LEFT_ICON}
        color="tonal"
        onClick={() => {
          navigate(searchParams.origin?.toString() ?? "../../../");
        }}
      >
        Back
      </UKButton>
      <div class={styles.header}>
        <img alt={""} class={styles.headerImage} src={application()?.bannerImage || "/assets/generic_background.svg"} />
      </div>
      <div class={styles.headerContent}>
        {application()?.icon.type === "image" ? (
          <img alt={""} class={styles.iconImage} src={application()?.icon.value || "/assets/tricolor/tricolor_icon.svg"} />
        ) : (
          <UKIcon class={styles.iconIcon}>{application()?.icon.value || ""}</UKIcon>
        )}
        <UKText role="display" size="m">
          {application()?.displayName}
        </UKText>
        <UKButton
          disabled={!application()?.isUserAdministrator || !application()?.canBeUninstalled}
          class={styles.headerContentButton}
          leadingIcon={application()?.isInstalled ? DELETE_ICON : DOWNLOAD_ICON}
          onClick={async () => {
            const app = application();

            if (!app) return;

            if (app.isInstalled) {
              await trpc.app.uninstall.mutate({ applicationId: app.id });
              window.location.reload();
            } else {
              await trpc.app.install.mutate({
                applicationId: app.id,
                repository: repository || "local",
              });
              window.location.reload();
            }
          }}
        >
          {application()?.isInstalled ? "Uninstall" : "Install"}
        </UKButton>
      </div>
      <UKCard color="filled" class={styles.description}>
        <UKText role="body" size="m">
          {application()?.description}
        </UKText>
      </UKCard>
      {/*TODO: implement this*/}
      {/*<UKCarousel>*/}
      {/*  <UKCard>*/}
      {/*    Image 1*/}
      {/*  </UKCard>*/}
      {/*  <UKCard>*/}
      {/*    Image 2*/}
      {/*  </UKCard>*/}
      {/*  <UKCard>*/}
      {/*    Image 3*/}
      {/*  </UKCard>*/}
      {/*</UKCarousel>*/}
      <UKStack class={styles.requirements}>
        <UKStackItem
          defaultExpanded
          labelText="Requirements"
          expandedComponent={
            <div class={styles.requirementsExpanded}>
              <UKText align={"end"} role="label" size="l">
                Storage Required
              </UKText>
              <UKText role="body" size="m">
                <>{Math.ceil((application()?.installSize ?? 0) / 1000)}KB</>
              </UKText>
              {application()?.graphicsAcceleration && (
                <>
                  <UKText align={"end"} role="label" size="l">
                    Graphics Acceleration
                  </UKText>
                  <UKText role="body" size="m">
                    <>{application()?.graphicsAcceleration ?? "Recommended"}</>
                  </UKText>
                </>
              )}
            </div>
          }
        />
      </UKStack>
      <UKDivider direction={DividerDirection.horizontal} width="middle-inset" class={styles.divider} />
      <UKCard color="filled" class={styles.author}>
        <UKText role="title" size="m">
          Created by
        </UKText>
        <For each={application()?.authors || []}>
          {(author) => {
            return (
              <UKText role="body" size="m">
                {author.name}
              </UKText>
            );
          }}
        </For>
      </UKCard>
      <UKDivider direction={DividerDirection.horizontal} width="middle-inset" class={styles.divider} />
      <UKCard color="filled" class={styles.repository}>
        <UKText role="label" size="m">
          Repository: {repository}
        </UKText>
        <UKText role="label" size="m">
          AppId: {application()?.id}
        </UKText>
      </UKCard>
    </div>
  );
};

export default ApplicationPage;
