import { useNavigate, useParams } from "@solidjs/router";
import { createResource, For, type Component } from "solid-js";
import styles from "./Index.module.scss";
import trpc from "../../lib/trpc";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.jsx";
import UKCard from "@tcsw/uikit-solid/src/components/card/UKCard.jsx";
import UKIcon from "@tcsw/uikit-solid/src/components/icon/UKIcon.jsx";
import UKDivider from "@tcsw/uikit-solid/src/components/divider/UKDivider.jsx";
import { DividerDirection } from "@tcsw/uikit-solid/src/components/divider/lib/direction.js";
import UKButton from "@tcsw/uikit-solid/src/components/button/UKButton.jsx";
import UKStack from "@tcsw/uikit-solid/src/components/stack/UKStack.jsx";
import UKStackItem from "@tcsw/uikit-solid/src/components/stack/UKStackItem.jsx";

const ApplicationPage: Component = () => {
    const { applicationId, repository } = useParams();
    const navigate = useNavigate();
    const [application] = createResource(() => trpc.app.get.query({ applicationId, repository }));

    return (
        <div class={styles.root}>
            <UKButton
                class={styles.backButton}
                leadingIcon="chevron_left"
                color="tonal"
                onClick={() => {
                    navigate("../../../");
                }}
            >
                Back
            </UKButton>
            <div class={styles.header}>
                <img
                    alt={""}
                    class={styles.headerImage}
                    src={application()?.bannerImage || "/assets/generic_background.svg"}
                />
            </div>
            <div class={styles.headerContent}>
                {application()?.icon.type === "image" ? (
                    <img
                        alt={""}
                        class={styles.iconImage}
                        src={application()?.icon.value || "/assets/tricolor/tricolor_icon.svg"}
                    />
                ) : (
                    <UKIcon class={styles.iconIcon}>{application()?.icon.value || ""}</UKIcon>
                )}
                <UKText role="display" size="m">
                    {application()?.displayName}
                </UKText>
                <UKButton
                    disabled={!application()?.isUserAdministrator || !application()?.canBeUninstalled}
                    class={styles.headerContentButton}
                    leadingIcon={application()?.isInstalled ? "delete" : "download"}
                    onClick={async () => {
                        const app = application();

                        if (!app) return;

                        if (app.isInstalled) {
                            await trpc.app.uninstall.mutate({ applicationId: app.id });
                            window.location.reload();
                        } else {
                            await trpc.app.install.mutate({
                                applicationId: app.id,
                                repository: repository,
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
            <UKStack class={styles.requirements}>
                <UKStackItem
                    labelText="Requirements"
                    expandedComponent={
                        <div class={styles.requirementsExpanded}>
                            <UKText role="label" size="l">
                                Instance Storage
                            </UKText>
                            <UKText role="body" size="m">
                                10GB
                            </UKText>
                            <UKText role="label" size="l">
                                Per User Storage (consumes personal quota)
                            </UKText>
                            <UKText role="body" size="m">
                                1GB
                            </UKText>
                            <UKText role="label" size="l">
                                Graphics Acceleration
                            </UKText>
                            <UKText role="body" size="m">
                                Recommended
                            </UKText>
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
            </UKCard>
        </div>
    );
};

export default ApplicationPage;
