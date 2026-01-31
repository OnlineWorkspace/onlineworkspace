import { createResource, For, type Component } from "solid-js";
import styles from "./Index.module.scss";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.jsx";
import UKTopAppBar from "@tcsw/uikit-solid/src/components/topAppBar/UKTopAppBar.jsx";
import { useNavigate, useParams } from "@solidjs/router";
import trpc from "../../../lib/trpc.ts";
import UKStackItem from "@tcsw/uikit-solid/src/components/stack/UKStackItem.tsx";
import UKStack from "@tcsw/uikit-solid/src/components/stack/UKStack.tsx";
import BooleanSetting from "./components/BooleanSetting/BooleanSetting";
import StringSetting from "./components/StringSetting/StringSetting.tsx";
import UKCard from "@tcsw/uikit-solid/src/components/card/UKCard.tsx";
import UKDivider from "@tcsw/uikit-solid/src/components/divider/UKDivider.tsx";
import UKButtonGroup from "@tcsw/uikit-solid/src/components/buttonGroup/UKButtonGroup.tsx";
import UKButton from "@tcsw/uikit-solid/src/components/button/UKButton.jsx";

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
                <div class={styles.pageHeader}>
                    <img class={styles.image} alt={""} src={"/assets/tricolor/tricolor_icon@4x.png"} />
                    <div class={styles.headerContent}>
                        <UKText role={"display"} size={"l"}>
                            {data()?.displayName}
                        </UKText>
                        <UKText class={styles.id} role={"label"} size={"l"}>
                            ({params.applicationId})
                        </UKText>
                        <UKButtonGroup size={"s"} align={"start"}>
                            <UKButton onClick={() => {}} color={"tonal"}>
                                Open in Store
                            </UKButton>
                        </UKButtonGroup>
                    </div>
                </div>
                <UKDivider direction={"horizontal"} />
                <UKText role={"title"} size={"m"} class={styles.subheading}>
                    User Settings
                </UKText>
                <UKStack>
                    {data()?.settings.length === 0 && (
                        <UKCard color={"filled"}>
                            <UKText role={"body"} size={"l"}>
                                This application has no settings to configure.
                            </UKText>
                        </UKCard>
                    )}
                    <For each={data()?.settings}>
                        {(setting) => {
                            switch (setting.type) {
                                case "boolean":
                                    return (
                                        <BooleanSetting
                                            id={setting.id}
                                            currentValue={setting.currentValue === "true"}
                                            defaultValue={setting.defaultValue === "true"}
                                            displayName={setting.displayName}
                                        />
                                    );
                                case "string":
                                    return (
                                        <StringSetting
                                            id={setting.id}
                                            currentValue={setting.currentValue}
                                            defaultValue={setting.defaultValue}
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
