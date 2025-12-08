import { createResource, createSignal, For, type Component } from "solid-js";
import styles from "./NavigationRailApplications.module.scss";
import UKIconButton from "@tcsw/uikit-solid/src/components/iconButton/UKIconButton.jsx";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.jsx";
import UKDivider from "@tcsw/uikit-solid/src/components/divider/UKDivider.jsx";
import { DividerDirection } from "@tcsw/uikit-solid/src/components/divider/lib/direction.js";
import UKList from "@tcsw/uikit-solid/src/components/list/UKList.jsx";
import trpc from "../../../lib/trpc";
import UKListItem from "@tcsw/uikit-solid/src/components/list/UKListItem.jsx";
import { useNavigate } from "@solidjs/router";

const NavigationRailApplications: Component<{ expanded: boolean }> = (props) => {
    const navigate = useNavigate();
    const [showApplicationDrawer, setShowApplicationDrawer] = createSignal<boolean>(false);
    const [applications] = createResource(() => trpc.app.navigation.getApplications.query());

    return (
        <div class={styles.root} data-expanded={props.expanded}>
            <UKIconButton
                alt={"Toggle Applications"}
                icon={"apps"}
                color={"standard"}
                onClick={() => {
                    setShowApplicationDrawer((sad) => !sad);
                }}
            />
            {showApplicationDrawer() && (
                <div class={styles.drawer}>
                    <UKText role={"title"} size="l">
                        Applications
                    </UKText>
                    <UKDivider direction={DividerDirection.horizontal} />
                    <div class={styles.appsGrid}>
                        <UKList>
                            <For each={applications()}>
                                {(app) => {
                                    return (
                                        <UKListItem
                                            labelText={app.label}
                                            onClick={() => {
                                                if (app.location.type === "local") {
                                                    navigate(app.location.value);
                                                } else if (app.location.type === "remote") {
                                                    window.location.href = app.location.value;
                                                }
                                            }}
                                            supportingText={`(${app.id})`}
                                            leading={app.icon}
                                        />
                                    );
                                }}
                            </For>
                        </UKList>
                        <UKText role={"label"} size={"m"}>
                            This is a work in progress
                        </UKText>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NavigationRailApplications;
