import { createResource, For, type Component } from "solid-js";
import styles from "./Index.module.scss";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.jsx";
import UKTopAppBar from "@tcsw/uikit-solid/src/components/topAppBar/UKTopAppBar.jsx";
import { useNavigate, useParams } from "@solidjs/router";
import trpc from "../../../lib/trpc.ts";
import UKStackItem from "@tcsw/uikit-solid/src/components/stack/UKStackItem.tsx";
import UKStack from "@tcsw/uikit-solid/src/components/stack/UKStack.tsx";
import BooleanSetting from "./components/BooleanSetting/BooleanSetting";

const ApplicationPage: Component = () => {
    const navigate = useNavigate();
    const params = useParams();
    const [data] = createResource(() => trpc.application.getApplication.query({ id: params.applicationId }));

    return (
        <>
            <UKTopAppBar
                type="small"
                headline={"Applications"}
                leadingButton={{
                    icon: "chevron_left",
                    onClick() {
                        navigate("/app/uk.tcsw.settings/applications");
                    },
                    accessibleLabel: "Go back",
                }}
            />
            <div class={styles.page}>
                <UKText role={"title"} size={"m"} class={styles.subheading}>
                    Application {params.applicationId}
                </UKText>
                <UKStack>
                    <For each={data()?.settings}>
                        {(setting) => {
                            switch (setting.type) {
                                case "boolean":
                                    return (
                                        <BooleanSetting
                                            id={setting.id}
                                            currentValue={false}
                                            defaultValue={setting.defaultValue === "true"}
                                            displayName={setting.displayName}
                                        />
                                    );
                                default:
                                    return <UKStackItem labelText={setting.displayName} supportingText={setting.id} />;
                            }
                        }}
                    </For>
                </UKStack>
            </div>
        </>
    );
};

export default ApplicationPage;
