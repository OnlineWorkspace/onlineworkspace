import { createResource, For, type Component } from "solid-js";
import styles from "./Index.module.scss";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.jsx";
import UKTopAppBar from "@tcsw/uikit-solid/src/components/topAppBar/UKTopAppBar.jsx";
import { useNavigate } from "@solidjs/router";
import UKStack from "@tcsw/uikit-solid/src/components/stack/UKStack.tsx";
import UKStackItem from "@tcsw/uikit-solid/src/components/stack/UKStackItem.tsx";
import trpc from "../../lib/trpc.ts";

const ApplicationsPage: Component = () => {
    const navigate = useNavigate();
    const [applications] = createResource(() => trpc.application.getApplications.query());

    return (
        <>
            <UKTopAppBar
                type="small"
                headline={"Applications"}
                leadingButton={{
                    icon: "chevron_left",
                    onClick() {
                        navigate("/app/uk.tcsw.settings");
                    },
                    accessibleLabel: "Go back",
                }}
            />
            <div class={styles.page}>
                <UKText role={"title"} size={"m"} class={styles.subheading}>
                    Applications
                </UKText>
                <UKStack>
                    <For each={applications()}>
                        {(app) => {
                            return (
                                <UKStackItem
                                    labelText={app.displayName}
                                    supportingText={app.id}
                                    onClick={() => navigate(`/app/uk.tcsw.settings/applications/${app.id}`)}
                                />
                            );
                        }}
                    </For>
                </UKStack>
            </div>
        </>
    );
};

export default ApplicationsPage;
