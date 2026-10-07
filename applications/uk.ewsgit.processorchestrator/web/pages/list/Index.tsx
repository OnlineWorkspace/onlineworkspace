import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.tsx";
import UKChip from "@ewsgit/uikit-solid/src/components/chip/UKChip.tsx";
import UKCircularProgressIndicator from "@ewsgit/uikit-solid/src/components/circularProgressIndicator/UKCircularProgressIndicator.tsx";
import UKDialog from "@ewsgit/uikit-solid/src/components/dialog/UKDialog.tsx";
import UKExtendedFloatingActionButton from "@ewsgit/uikit-solid/src/components/extendedFloatingActionButton/UKExtendedFloatingActionButton.tsx";
import UKIcon from "@ewsgit/uikit-solid/src/components/icon/UKIcon.tsx";
import UKIconButton from "@ewsgit/uikit-solid/src/components/iconButton/UKIconButton.tsx";
import UKListItem from "@ewsgit/uikit-solid/src/components/list/UKListItem.tsx";
import UKSearchBar from "@ewsgit/uikit-solid/src/components/searchBar/UKSearchBar.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import UKTopAppBar from "@ewsgit/uikit-solid/src/components/topAppBar/UKTopAppBar.tsx";
import ACCOUNT_TREE_ICON from "@material-symbols/svg-700/outlined/account_tree.svg";
import ADD_ICON from "@material-symbols/svg-700/outlined/add.svg";
import PLAY_ARROW_ICON from "@material-symbols/svg-700/outlined/play_arrow.svg";
import RESTART_ALT_ICON from "@material-symbols/svg-700/outlined/restart_alt.svg";
import STOP_ICON from "@material-symbols/svg-700/outlined/stop.svg";
import TERMINAL_ICON from "@material-symbols/svg-700/outlined/terminal.svg";
import { useNavigate } from "@solidjs/router";
import { type Component, createMemo, createSignal, For, Show } from "solid-js";
import GitImportDialog from "../../components/GitImportDialog";
import ProcessDialog, { type ProcessFormValue } from "../../components/ProcessDialog";
import StatusChip from "../../components/StatusChip";
import { commandLine, formatDuration } from "../../lib/format";
import { useProcesses } from "../../lib/ProcessesProvider";
import { routes } from "../../lib/routes";
import trpc from "../../lib/trpc";
import type { ProcessDto } from "../../lib/types";
import styles from "./Index.module.scss";

type Filter = "all" | "running" | "stopped" | "crashed";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "running", label: "Running" },
  { id: "stopped", label: "Stopped" },
  { id: "crashed", label: "Crashed" },
];

const matchesFilter = (process: ProcessDto, filter: Filter) => {
  const state = process.status.state;

  if (filter === "running") return state === "running" || state === "starting" || state === "restarting";
  if (filter === "stopped") return state === "stopped" || state === "stopping";
  if (filter === "crashed") return state === "crashed";

  return true;
};

const ProcessCard: Component<{ process: ProcessDto }> = (props) => {
  const { act } = useProcesses();
  const navigate = useNavigate();
  const active = () => ["running", "starting", "restarting", "stopping"].includes(props.process.status.state);
  const uptime = () => (props.process.status.startedAt ? formatDuration(Date.now() - props.process.status.startedAt) : undefined);

  return (
    <UKCard color="filled" class={styles.card} onClick={() => navigate(routes.detail(props.process.id))}>
      <div class={styles.cardHeader}>
        <UKText role="title" size="l" class={styles.name}>
          {props.process.name}
        </UKText>
        <Show when={props.process.source === "git"}>
          <UKIcon class={styles.sourceIcon} aria-label="From a git repository">
            {ACCOUNT_TREE_ICON}
          </UKIcon>
        </Show>
      </div>
      <UKText role="body" size="s" class={styles.command}>
        {commandLine(props.process.executable, props.process.args)}
      </UKText>
      <div class={styles.cardFooter}>
        <StatusChip state={props.process.status.state} />
        <UKText role="label" size="m" class={styles.meta}>
          {[uptime() && `Up ${uptime()}`, props.process.status.restarts > 0 && `${props.process.status.restarts} restarts`].filter(Boolean).join(" · ")}
        </UKText>
        <div class={styles.spacer} />
        <Show
          when={active()}
          fallback={
            <UKIconButton
              icon={PLAY_ARROW_ICON}
              alt={`Start ${props.process.name}`}
              color="tonal"
              onClick={() => act(() => trpc.start.mutate({ id: props.process.id }))}
            />
          }
        >
          <UKIconButton
            icon={RESTART_ALT_ICON}
            alt={`Restart ${props.process.name}`}
            color="standard"
            onClick={() => act(() => trpc.restart.mutate({ id: props.process.id }))}
          />
          <UKIconButton
            icon={STOP_ICON}
            alt={`Stop ${props.process.name}`}
            color="tonal"
            onClick={() => act(() => trpc.stop.mutate({ id: props.process.id }))}
          />
        </Show>
      </div>
    </UKCard>
  );
};

const ListPage: Component = () => {
  const { processes, loading, error, perform, notify, refresh } = useProcesses();
  const [query, setQuery] = createSignal("");
  const [filter, setFilter] = createSignal<Filter>("all");
  const [chooser, setChooser] = createSignal(false);
  const [manualDialog, setManualDialog] = createSignal(false);
  const [gitDialog, setGitDialog] = createSignal(false);

  const visible = createMemo(() => {
    const needle = query().trim().toLowerCase();

    return (processes() ?? []).filter((p) => matchesFilter(p, filter()) && (needle === "" || `${p.name} ${p.executable}`.toLowerCase().includes(needle)));
  });

  const create = async (value: ProcessFormValue) => (await perform(() => trpc.create.mutate(value), `Added ${value.name}`)) !== undefined;

  const add = (open: () => void) => {
    setChooser(false);
    open();
  };

  return (
    <div class={styles.page}>
      <UKTopAppBar type="large" headline="Processes" subtitle="Run and watch programs on this server" />

      <div class={styles.content}>
        <UKSearchBar value={query} placeholder="Search processes" onValueChange={setQuery} leadingIcon={TERMINAL_ICON} class={styles.search} />

        <div class={styles.filters}>
          <For each={FILTERS}>
            {(item) => (
              <UKChip type="filter_deselectable" isSelected={filter() === item.id} select={() => setFilter(item.id)} deselect={() => setFilter("all")}>
                {item.label}
              </UKChip>
            )}
          </For>
        </div>

        <Show when={loading()}>
          <UKCircularProgressIndicator class={styles.spinner} />
        </Show>

        <Show when={error() && !processes()}>
          <div class={styles.empty}>
            <UKText role="title" size="m">
              Could not load the processes
            </UKText>
            <UKText role="body" size="m" class={styles.meta}>
              Only administrators can use this application.
            </UKText>
            <UKButton color="tonal" size="s" onClick={() => refresh()}>
              Try again
            </UKButton>
          </div>
        </Show>

        <Show when={processes() && processes()!.length === 0}>
          <div class={styles.empty}>
            <UKIcon class={styles.emptyIcon}>{TERMINAL_ICON}</UKIcon>
            <UKText role="title" size="l">
              No processes yet
            </UKText>
            <UKText role="body" size="m" class={styles.meta}>
              Add a program by its path, or import several from a git repository.
            </UKText>
            <div class={styles.emptyActions}>
              <UKButton color="filled" size="s" leadingIcon={ADD_ICON} onClick={() => void setManualDialog(true)}>
                Add executable
              </UKButton>
              <UKButton color="tonal" size="s" leadingIcon={ACCOUNT_TREE_ICON} onClick={() => void setGitDialog(true)}>
                From git
              </UKButton>
            </div>
          </div>
        </Show>

        <Show when={processes() && processes()!.length > 0 && visible().length === 0}>
          <UKText role="body" size="m" class={styles.meta}>
            No processes match.
          </UKText>
        </Show>

        <div class={styles.grid}>
          <For each={visible()}>{(process) => <ProcessCard process={process} />}</For>
        </div>
      </div>

      <UKExtendedFloatingActionButton class={styles.fab} size="medium" color="primary" leadingIcon={ADD_ICON} onClick={() => setChooser(true)}>
        Add process
      </UKExtendedFloatingActionButton>

      <UKDialog show={chooser} onClose={() => setChooser(false)} maxWidth="26rem" adaptToMobile>
        <div class={styles.chooser}>
          <UKText role="headline" size="s">
            Add a process
          </UKText>
          <UKListItem
            labelText="Executable"
            supportingText="A program on the server, with arguments and environment"
            leading={{ type: "icon", value: TERMINAL_ICON }}
            onClick={() => add(() => setManualDialog(true))}
          />
          <UKListItem
            labelText="Git repository"
            supportingText="Read processorchestrator.json from a repository"
            leading={{ type: "icon", value: ACCOUNT_TREE_ICON }}
            onClick={() => add(() => setGitDialog(true))}
          />
        </div>
      </UKDialog>

      <ProcessDialog show={manualDialog} onClose={() => setManualDialog(false)} onSave={create} />
      <GitImportDialog
        show={gitDialog}
        onClose={() => setGitDialog(false)}
        onImported={(names) => {
          notify(`Added ${names.join(", ")}`);
          refresh();
        }}
      />
    </div>
  );
};

export default ListPage;
