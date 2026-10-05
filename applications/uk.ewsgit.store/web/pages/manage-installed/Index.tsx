import CHECK_ICON from "@material-symbols/svg-700/outlined/check.svg";
import CLOSE_ICON from "@material-symbols/svg-700/outlined/close.svg";
import DELETE_ICON from "@material-symbols/svg-700/outlined/delete.svg";
import SEARCH_ICON from "@material-symbols/svg-700/outlined/search.svg";
import SELECT_ICON from "@material-symbols/svg-700/outlined/checklist.svg";
import STORE_ICON from "@material-symbols/svg-700/outlined/store.svg";
import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKButtonGroup from "@ewsgit/uikit-solid/src/components/buttonGroup/UKButtonGroup.tsx";
import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.tsx";
import UKDialog from "@ewsgit/uikit-solid/src/components/dialog/UKDialog.tsx";
import UKDivider from "@ewsgit/uikit-solid/src/components/divider/UKDivider.tsx";
import UKIcon from "@ewsgit/uikit-solid/src/components/icon/UKIcon.tsx";
import UKIconButton from "@ewsgit/uikit-solid/src/components/iconButton/UKIconButton.tsx";
import UKSwitch from "@ewsgit/uikit-solid/src/components/switch/UKSwitch.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import UKTextField from "@ewsgit/uikit-solid/src/components/textField/UKTextField.tsx";
import UKTopAppBar from "@ewsgit/uikit-solid/src/components/topAppBar/UKTopAppBar.tsx";
import { useNavigate } from "@solidjs/router";
import { type Component, createEffect, createMemo, createResource, createSignal, For, Show } from "solid-js";
import ApplicationIcon from "../../components/ApplicationIcon/ApplicationIcon";
import trpc from "../../lib/trpc";
import styles from "./Index.module.scss";

type Filter = "all" | "enabled" | "disabled";

const ManageInstalledPage: Component = () => {
  const navigate = useNavigate();
  const [installed, { refetch }] = createResource(() => trpc.manageInstalled.getApplications.query());
  const [enabledApplications, setEnabledApplications] = createSignal<string[]>([]);
  const [selectionMode, setSelectionMode] = createSignal(false);
  const [selectedIds, setSelectedIds] = createSignal<string[]>([]);
  const [search, setSearch] = createSignal("");
  const [filter, setFilter] = createSignal<Filter>("all");
  const [busyIds, setBusyIds] = createSignal<string[]>([]);
  const [confirmingUninstall, setConfirmingUninstall] = createSignal(false);
  const [uninstalling, setUninstalling] = createSignal(false);
  const [errorMessage, setErrorMessage] = createSignal<string | undefined>(undefined);

  createEffect(() => setEnabledApplications(installed()?.enabledApplications ?? []));

  const applications = () => installed()?.applications ?? [];
  const isProtected = (id: string) => installed()?.cannotDisable.includes(id) ?? false;
  const isEnabled = (id: string) => enabledApplications().includes(id);

  const visibleApplications = createMemo(() => {
    const query = search().trim().toLowerCase();

    return applications().filter((app) => {
      if (filter() === "enabled" && !isEnabled(app.id)) return false;
      if (filter() === "disabled" && isEnabled(app.id)) return false;

      return query === "" || `${app.displayName} ${app.id} ${app.description}`.toLowerCase().includes(query);
    });
  });

  const selectedApplications = () => applications().filter((a) => selectedIds().includes(a.id));

  const leaveSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds([]);
  };

  const toggleSelected = (id: string) => setSelectedIds((current) => (current.includes(id) ? current.filter((i) => i !== id) : [...current, id]));

  const setEnabled = async (id: string, enabled: boolean) => {
    const previous = enabledApplications();
    const next = enabled ? [...previous, id] : previous.filter((i) => i !== id);

    setEnabledApplications(next);
    setBusyIds((current) => [...current, id]);
    setErrorMessage(undefined);

    try {
      await trpc.manageInstalled.setEnabledApplications.mutate({ enabledApplications: next });
    } catch {
      // put the switch back, as nothing changed on the server
      setEnabledApplications(previous);
      setErrorMessage(`Couldn't ${enabled ? "enable" : "disable"} that application. Only administrators can change this.`);
    } finally {
      setBusyIds((current) => current.filter((i) => i !== id));
    }
  };

  const uninstallSelected = async () => {
    setUninstalling(true);
    setErrorMessage(undefined);

    try {
      await trpc.manageInstalled.uninstallApplications.mutate({ applications: selectedIds() });
      await refetch();
      leaveSelectionMode();
    } catch {
      setErrorMessage("Couldn't uninstall the selected applications. Only administrators can do this.");
    } finally {
      setUninstalling(false);
      setConfirmingUninstall(false);
    }
  };

  const filterButton = (value: Filter, label: string, count: number) => (
    <UKButton color={filter() === value ? "filled" : "tonal"} leadingIcon={filter() === value ? CHECK_ICON : undefined} onClick={() => {
        setFilter(value);
      }}>
      {label} · {count}
    </UKButton>
  );

  return (
    <div class={styles.page}>
      <UKTopAppBar
        type={"small"}
        headline={"Installed Applications"}
        trailingElements={
          <UKButton
            color={selectionMode() ? "tonal" : "standard"}
            size="s"
            leadingIcon={selectionMode() ? CLOSE_ICON : SELECT_ICON}
            disabled={applications().length === 0}
            onClick={() => {
              if (selectionMode()) leaveSelectionMode();
              else setSelectionMode(true);
            }}
          >
            {selectionMode() ? "Done" : "Select"}
          </UKButton>
        }
      />

      <div class={styles.content}>
        <div class={styles.toolbar}>
          <UKTextField
            class={styles.search}
            containerClass={styles.searchContainer}
            color="filled"
            label="Search installed applications"
            leadingIcon={{ icon: SEARCH_ICON }}
            value={search()}
            defaultValue={search()}
            onValueChange={setSearch}
          />
          <UKButtonGroup size="s" connected={true}>
            {filterButton("all", "All", applications().length)}
            {filterButton("enabled", "Enabled", applications().filter((a) => isEnabled(a.id)).length)}
            {filterButton("disabled", "Disabled", applications().filter((a) => !isEnabled(a.id)).length)}
          </UKButtonGroup>
        </div>

        <Show when={errorMessage()}>
          <UKText role="body" size="m" class={styles.error}>
            {errorMessage()}
          </UKText>
        </Show>

        <Show
          when={!installed.loading || installed()}
          fallback={
            <div class={styles.list}>
              <For each={[1, 2, 3, 4]}>{() => <div class={styles.skeleton} />}</For>
            </div>
          }
        >
          <Show
            when={visibleApplications().length > 0}
            fallback={
              <div class={styles.empty}>
                <UKIcon class={styles.emptyIcon}>{STORE_ICON}</UKIcon>
                <UKText role="title" size="l">
                  {applications().length === 0 ? "Nothing installed yet" : "No applications match"}
                </UKText>
                <UKText role="body" size="m" class={styles.muted}>
                  {applications().length === 0 ? "Applications you install from the store will show up here." : "Try a different search or filter."}
                </UKText>
                <UKButton color="tonal" onClick={() => navigate("/app/uk.ewsgit.store")}>
                  Browse the store
                </UKButton>
              </div>
            }
          >
            <div class={styles.list}>
              <For each={visibleApplications()}>
                {(app) => {
                  const selected = () => selectedIds().includes(app.id);
                  const selectable = () => selectionMode() && !isProtected(app.id);

                  return (
                    <UKCard
                      color="filled"
                      class={styles.row}
                      data-selected={selected()}
                      data-disabled={!isEnabled(app.id)}
                      onClick={selectable() ? () => toggleSelected(app.id) : undefined}
                    >
                      <Show when={selectionMode()}>
                        <div class={styles.selectMark} data-selected={selected()} data-unavailable={isProtected(app.id)}>
                          <Show when={selected()}>
                            <UKIcon>{CHECK_ICON}</UKIcon>
                          </Show>
                        </div>
                      </Show>
                      <ApplicationIcon icon={app.icon} size="m" />
                      <div class={styles.text}>
                        <div class={styles.titleRow}>
                          <UKText role="title" size="m" emphasized align="start" class={styles.title}>
                            {app.displayName}
                          </UKText>
                          <UKText role="label" size="s" class={styles.chip}>
                            v{app.version}
                          </UKText>
                          <Show when={isProtected(app.id)}>
                            <UKText role="label" size="s" class={styles.chip} data-tone="required">
                              Required
                            </UKText>
                          </Show>
                        </div>
                        <UKText role="body" size="s" align="start" class={styles.description}>
                          {app.description}
                        </UKText>
                        <UKText role="label" size="s" align="start" class={styles.muted}>
                          {app.id}
                        </UKText>
                      </div>
                      <Show when={!selectionMode()}>
                        <div class={styles.actions}>
                          <UKIconButton
                            icon={STORE_ICON}
                            alt={`Open ${app.displayName} in the store`}
                            color="standard"
                            onClick={() => navigate(`/app/uk.ewsgit.store/app/${app.repository}/${app.id}?origin=/app/uk.ewsgit.store/manage-installed`)}
                          />
                          <Show when={!isProtected(app.id)}>
                            <UKSwitch
                              icon={true}
                              disabled={busyIds().includes(app.id)}
                              value={isEnabled(app.id)}
                              onValueChange={(value) => setEnabled(app.id, value)}
                            />
                          </Show>
                        </div>
                      </Show>
                    </UKCard>
                  );
                }}
              </For>
            </div>
          </Show>
        </Show>
      </div>

      <Show when={selectionMode()}>
        <div class={styles.selectionBar}>
          <UKText role="label" size="l">
            {selectedIds().length === 0 ? "Select applications to uninstall" : `${selectedIds().length} selected`}
          </UKText>
          <UKButton color="filled" size="s" leadingIcon={DELETE_ICON} disabled={selectedIds().length === 0} onClick={() => {
              setConfirmingUninstall(true);
            }}>
            Uninstall
          </UKButton>
        </div>
      </Show>

      <UKDialog show={confirmingUninstall} onClose={() => !uninstalling() && setConfirmingUninstall(false)}>
        <UKText role="title" size="l">
          Uninstall {selectedIds().length === 1 ? "application" : `${selectedIds().length} applications`}?
        </UKText>
        <UKDivider direction="horizontal" />
        <UKText role="body" size="m">
          The following will be removed from this instance:
        </UKText>
        <ul class={styles.confirmList}>
          <For each={selectedApplications()}>{(app) => <li>{app.displayName}</li>}</For>
        </ul>
        <UKButtonGroup size="s" align="end">
          <UKButton color="tonal" disabled={uninstalling()} onClick={uninstallSelected}>
            {uninstalling() ? "Uninstalling…" : "Yes, uninstall"}
          </UKButton>
          <UKButton color="filled" disabled={uninstalling()} onClick={() => {
              setConfirmingUninstall(false);
            }}>
            Cancel
          </UKButton>
        </UKButtonGroup>
      </UKDialog>
    </div>
  );
};

export default ManageInstalledPage;
