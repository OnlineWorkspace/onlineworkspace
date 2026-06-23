import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.tsx";
import UKIcon from "@ewsgit/uikit-solid/src/components/icon/UKIcon.tsx";
import UKIconButton from "@ewsgit/uikit-solid/src/components/iconButton/UKIconButton.tsx";
import UKStack from "@ewsgit/uikit-solid/src/components/stack/UKStack.tsx";
import UKStackItem from "@ewsgit/uikit-solid/src/components/stack/UKStackItem.tsx";
import UKSwitch from "@ewsgit/uikit-solid/src/components/switch/UKSwitch.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import UKTopAppBar from "@ewsgit/uikit-solid/src/components/topAppBar/UKTopAppBar.tsx";
import { useNavigate } from "@solidjs/router";
import { type Component, createEffect, createResource, createSignal, For, Suspense } from "solid-js";
import trpc from "../../lib/trpc";
import styles from "./Index.module.scss";

const ManageInstalledPage: Component = () => {
  const navigate = useNavigate();
  const [selectionMode, setSelectionMode] = createSignal<boolean>(false);
  const [selectedApplicationIds, setSelectedApplicationIds] = createSignal<string[]>([]);
  const [installedApplications, { refetch: refetchInstalledApplications }] = createResource(() => trpc.manageInstalled.getApplications.query());
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
            )}
            {selectionMode() && <UKText role={"label"} size={"m"}>{`Selected: ${selectedApplicationIds().length}`}</UKText>}
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
      <Suspense>
        <UKStack class={styles.content}>
          <For each={installedApplications()?.applications || []}>
            {(app) => {
              return (
                <Suspense>
                  <UKStackItem
                    leading={
                      app.icon.type === "icon"
                        ? { type: "icon" as const, value: app.icon.value, alt: "" }
                        : {
                            type: "image" as const,
                            value: app.icon.value,
                            alt: "",
                          }
                    }
                    supportingText={`(${app.id}) - ${app.description}`}
                    labelText={app.displayName}
                    inlineComponent={
                      !selectionMode() ? (
                        <>
                          <UKIconButton
                            class={styles.openInStoreButton}
                            icon={"store"}
                            alt={"go to store page"}
                            color={"standard"}
                            onClick={() => navigate(`/app/uk.ewsgit.store/app/${app.repository}/${app.id}?origin=/app/uk.ewsgit.store/manage-installed`)}
                          />
                          {installedApplications()?.cannotDisable.includes(app.id) ? null : (
                            <UKSwitch
                              icon={true}
                              class={styles.stackSwitch}
                              onValueChange={async (val) => {
                                if (val) {
                                  setEnabledApplications((prev) => [...prev, app.id]);
                                } else {
                                  setEnabledApplications((prev) => prev.filter((i) => i !== app.id));
                                }

                                await trpc.manageInstalled.setEnabledApplications.mutate({
                                  enabledApplications: enabledApplications(),
                                });
                              }}
                              value={enabledApplications().includes(app.id)}
                            />
                          )}
                        </>
                      ) : installedApplications()?.cannotDisable.includes(app.id) ? null : (
                        <UKIcon class={styles.stackSelect}>{selectedApplicationIds().includes(app.id) ? "check" : "check_indeterminate_small"}</UKIcon>
                      )
                    }
                    onClick={
                      selectionMode()
                        ? installedApplications()?.cannotDisable.includes(app.id)
                          ? undefined
                          : async () => {
                              if (!selectedApplicationIds().includes(app.id)) {
                                setSelectedApplicationIds((prev) => [...prev, app.id]);
                              } else {
                                setSelectedApplicationIds((prev) => prev.filter((i) => i !== app.id));
                              }
                            }
                        : undefined
                    }
                  />
                </Suspense>
              );
            }}
          </For>
        </UKStack>
      </Suspense>
    </div>
  );
};

export default ManageInstalledPage;
