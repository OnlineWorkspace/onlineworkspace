import { type Component, createResource } from "solid-js";
import styles from "./index.module.scss";
import UKDivider from "@tcsw/uikit-solid/src/components/divider/UKDivider.jsx";
import { DividerDirection } from "@tcsw/uikit-solid/src/components/divider/lib/direction.js";
import UKAvatar from "@tcsw/uikit-solid/src/components/avatar/UKAvatar.jsx";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.jsx";
import Shortcut from "./component/Shortcut/Shortcut";
import trpc from "../../lib/trpc";
import { useNavigate } from "@solidjs/router";
import UKStack from "@tcsw/uikit-solid/src/components/stack/UKStack.tsx";
import UKTopAppBar from "@tcsw/uikit-solid/src/components/topAppBar/UKTopAppBar.jsx";

const RootPage: Component = () => {
    const navigate = useNavigate();
    const [fullName] = createResource(() => trpc.overview.user.fullName.query());
    const [role] = createResource(() => trpc.overview.user.role.query());
    const [avatar] = createResource(() => trpc.overview.user.getAvatar.query());

    return (
        <>
            <UKTopAppBar type="small" headline={"Overview"} />
            <div class={styles.root}>
                <div class={styles.content}>
                    <div
                        class={styles.header}
                        onClick={() => {
                            navigate("/app/uk.tcsw.settings/profile");
                        }}
                    >
                        <UKAvatar
                            username="username"
                            avatar={avatar() || "/assets/placeholder/avatar.png"}
                            size="l"
                        />
                        <div>
                            <UKText role="display" size="l" emphasized class={styles.fullName}>
                                {fullName() || "Unknown"}
                            </UKText>
                            <UKText role="label" size="l" class={styles.permissionLevel}>
                                {role() || "Unknown"}
                            </UKText>
                        </div>
                    </div>
                    <UKDivider
                        class={styles.divider}
                        direction={DividerDirection.horizontal}
                        width="middle-inset"
                    />
                    <UKStack>
                        <Shortcut
                            title="Storage"
                            description="Visualise storage usage & clean up duplicates"
                            icon="storage"
                            path="/app/uk.tcsw.settings/storage"
                        />
                        <Shortcut
                            title="Customization"
                            description="Choose a wallpaper and color theme"
                            icon="wallpaper"
                            path="/app/uk.tcsw.settings/customization"
                        />
                        {role() === "Administrator" && (
                            <Shortcut
                                title="Configure Instance"
                                description="(ADMINISTRATORS ONLY) Manage the instance & it’s users"
                                icon="settings_applications"
                                path="/app/uk.tcsw.settings/instance"
                            />
                        )}
                    </UKStack>
                </div>
            </div>
        </>
    );
};

export default RootPage;
