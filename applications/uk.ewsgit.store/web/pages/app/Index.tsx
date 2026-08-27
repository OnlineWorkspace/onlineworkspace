import CHEVRON_LEFT_ICON from "@material-symbols/svg-700/outlined/chevron_left.svg";
import DELETE_ICON from "@material-symbols/svg-700/outlined/delete.svg";
import DOWNLOAD_ICON from "@material-symbols/svg-700/outlined/download.svg";
import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.tsx";
import { DividerDirection } from "@ewsgit/uikit-solid/src/components/divider/lib/direction.ts";
import UKDivider from "@ewsgit/uikit-solid/src/components/divider/UKDivider.tsx";
import UKIcon from "@ewsgit/uikit-solid/src/components/icon/UKIcon.tsx";
import UKStack from "@ewsgit/uikit-solid/src/components/stack/UKStack.tsx";
import UKStackItem from "@ewsgit/uikit-solid/src/components/stack/UKStackItem.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import { useNavigate, useParams, useSearchParams } from "@solidjs/router";
import { type Component, createResource, For } from "solid-js";
import trpc from "../../lib/trpc";
import styles from "./Index.module.scss";

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
        <img
          alt={""}
          class={styles.headerImage}
          src={application()?.bannerImage ||
            "/assets/placeholder/placeholder_image.svg"}
        />
      </div>
      <div class={styles.headerContent}>
        {application()?.icon.type === "image"
          ? (
            <img
              alt={""}
              class={styles.iconImage}
              src={application()?.icon.value ||
                "/assets/onlineworkspace/online_workspace_logo.svg"}
            />
          )
          : (
            <UKIcon class={styles.iconIcon}>
              {application()?.icon.value || ""}
            </UKIcon>
          )}
        <UKText role="display" size="m">
          {application()?.displayName}
        </UKText>
        <UKButton
          disabled={!application()?.isUserAdministrator ||
            !application()?.canBeUninstalled}
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
      {!application()?.isUserAdministrator ? (
        <UKCard color="elevated" class={styles.permissionWarning}>
          <UKText role="body" size="l">
            Info: You are not an administrator and lack the permission to
            install or uninstall applications.
          </UKText>
        </UKCard>
      ) : !application()?.canBeUninstalled && (
        <UKCard color="elevated" class={styles.permissionWarning}>
          <UKText role="body" size="l">
            This application is bundled with Online Workspace and cannot be
            uninstalled without enabling the "shoot_yourself_in_the_foot" feature.
          </UKText>
        </UKCard>
      )}
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
              {(application()?.permissions || []).length > 0
                ? (
                  <>
                    <UKText align={"end"} role="label" size="l">
                      Permissions
                    </UKText>
                    <UKText role="body" size="m">
                    {application()?.permissions?.join(", ")}
                    </UKText>
                  </>
                )
                : null}
            </div>
          }
        />
      </UKStack>
      <UKDivider
        direction={DividerDirection.horizontal}
        width="middle-inset"
        class={styles.divider}
      />
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
      <UKDivider
        direction={DividerDirection.horizontal}
        width="middle-inset"
        class={styles.divider}
      />
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
