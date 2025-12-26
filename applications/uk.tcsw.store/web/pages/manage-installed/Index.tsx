import UKText from "@tcsw/uikit-solid/src/components/text/UKText.jsx";
import { createEffect, createResource, createSignal, For, type Component } from "solid-js";
import styles from "./Index.module.scss";
import UKIconButton from "@tcsw/uikit-solid/src/components/iconButton/UKIconButton.jsx";
import trpc from "../../lib/trpc";
import UKButton from "@tcsw/uikit-solid/src/components/button/UKButton.jsx";
import UKStack from "@tcsw/uikit-solid/src/components/stack/UKStack.jsx";
import UKSwitch from "@tcsw/uikit-solid/src/components/switch/UKSwitch.jsx";
import UKStackItem from "@tcsw/uikit-solid/src/components/stack/UKStackItem.jsx";
import UKIcon from "@tcsw/uikit-solid/src/components/icon/UKIcon.jsx";
import UKTopAppBar from "@tcsw/uikit-solid/src/components/topAppBar/UKTopAppBar.jsx";

const ManageInstalledPage: Component = () => {
    const [selectionMode, setSelectionMode] = createSignal<boolean>(false);
    const [selectedApplicationIds, setSelectedApplicationIds] = createSignal<string[]>([]);
    const [installedApplications, { refetch: refetchInstalledApplications }] = createResource(() =>
        trpc.manageInstalled.getApplications.query(),
    );
    const [enabledApplications, setEnabledApplications] = createSignal<string[]>([]);

    createEffect(() => {
        setEnabledApplications(installedApplications()?.enabledApplications || []);
    });

    return (
        <div class={styles.page}>
            <UKTopAppBar
                type={"small"}
                headline={"Manage Installed Applications"}
                trailingElements={
                    <>
                        {selectionMode() && (
                            <>
                                <UKButton
                                    disabled={selectedApplicationIds().length < 1}
                                    leadingIcon={"delete"}
                                    onClick={async () => {
                                        await trpc.manageInstalled.uninstallApplications.mutate({
                                            applications: selectedApplicationIds(),
                                        });
                                        await refetchInstalledApplications();
                                        setSelectedApplicationIds([]);
                                        setSelectionMode(false);
                                        return;
                                    }}
                                    color={"filled"}
                                    size={"s"}
                                >
                                    Uninstall
                                </UKButton>
                            </>
                        )}
                        {selectionMode() && (
                            <UKText
                                role={"label"}
                                size={"m"}
                            >{`Selected: ${selectedApplicationIds().length}`}</UKText>
                        )}
                        <UKIconButton
                            color={"standard"}
                            alt={"select"}
                            icon={selectionMode() ? "close_small" : "select"}
                            onClick={() => {
                                if (selectionMode()) setSelectedApplicationIds([]);

                                setSelectionMode(!selectionMode());
                            }}
                        />
                    </>
                }
            />

            {/* Perhaps add this at some point, create a dialogue with a text field for a custom install uri */}
            {/* {!selectionMode() && (
                    <UKIconButton
                        color={"filled"}
                        alt={"install application"}
                        icon={"add"}
                        onClick={() => {
                            // add logic (probably a dialogue with a UKTextField)
                        }}
                    />
                )} */}
            <UKStack class={styles.content}>
                <For each={installedApplications()?.applications || []}>
                    {(app) => {
                        return (
                            <UKStackItem
                                leading={
                                    app.icon.type === "icon"
                                        ? { type: "icon" as const, value: app.icon.value }
                                        : { type: "image" as const, value: app.icon.value, alt: "" }
                                }
                                supportingText={`(${app.id}) - ${app.description}`}
                                labelText={app.displayName}
                                inlineComponent={
                                    !selectionMode() ? (
                                        installedApplications()?.cannotDisable.includes(app.id) ? (
                                            <></>
                                        ) : (
                                            <UKSwitch
                                                icon={true}
                                                class={styles.stackSwitch}
                                                getValue={(val) => {
                                                    if (val) {
                                                        setEnabledApplications((prev) => [
                                                            ...prev,
                                                            app.id,
                                                        ]);
                                                        return;
                                                    }

                                                    setEnabledApplications((prev) =>
                                                        prev.filter((i) => i !== app.id),
                                                    );
                                                }}
                                                value={enabledApplications().includes(app.id)}
                                            />
                                        )
                                    ) : installedApplications()?.cannotDisable.includes(app.id) ? (
                                        <></>
                                    ) : (
                                        <UKIcon class={styles.stackSelect}>
                                            {selectedApplicationIds().includes(app.id)
                                                ? "check"
                                                : "check_indeterminate_small"}
                                        </UKIcon>
                                    )
                                }
                                onClick={
                                    selectionMode()
                                        ? installedApplications()?.cannotDisable.includes(app.id)
                                            ? undefined
                                            : () => {
                                                  if (!selectedApplicationIds().includes(app.id)) {
                                                      setSelectedApplicationIds((prev) => [
                                                          ...prev,
                                                          app.id,
                                                      ]);
                                                  } else {
                                                      setSelectedApplicationIds((prev) =>
                                                          prev.filter((i) => i !== app.id),
                                                      );
                                                  }
                                              }
                                        : undefined
                                }
                            />
                        );
                    }}
                </For>
            </UKStack>
            <div class={styles.actions}>
                <UKButton
                    onClick={async () => {
                        await trpc.manageInstalled.setEnabledApplications.mutate({
                            enabledApplications: enabledApplications(),
                        });
                    }}
                    color={"filled"}
                    size={"s"}
                >
                    Apply Changes
                </UKButton>
            </div>
        </div>
    );
};

export default ManageInstalledPage;
