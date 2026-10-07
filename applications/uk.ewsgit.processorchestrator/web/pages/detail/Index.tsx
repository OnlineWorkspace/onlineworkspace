import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.tsx";
import UKChip from "@ewsgit/uikit-solid/src/components/chip/UKChip.tsx";
import UKCircularProgressIndicator from "@ewsgit/uikit-solid/src/components/circularProgressIndicator/UKCircularProgressIndicator.tsx";
import UKDialog from "@ewsgit/uikit-solid/src/components/dialog/UKDialog.tsx";
import UKIconButton from "@ewsgit/uikit-solid/src/components/iconButton/UKIconButton.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import useIsMobile from "@ewsgit/uikit-solid/src/core/useIsMobile.ts";
import ARROW_BACK_ICON from "@material-symbols/svg-700/outlined/arrow_back.svg";
import CONTENT_COPY_ICON from "@material-symbols/svg-700/outlined/content_copy.svg";
import DELETE_ICON from "@material-symbols/svg-700/outlined/delete.svg";
import DELETE_SWEEP_ICON from "@material-symbols/svg-700/outlined/delete_sweep.svg";
import DOWNLOAD_ICON from "@material-symbols/svg-700/outlined/download.svg";
import EDIT_ICON from "@material-symbols/svg-700/outlined/edit.svg";
import PLAY_ARROW_ICON from "@material-symbols/svg-700/outlined/play_arrow.svg";
import RESTART_ALT_ICON from "@material-symbols/svg-700/outlined/restart_alt.svg";
import STOP_ICON from "@material-symbols/svg-700/outlined/stop.svg";
import SYNC_ICON from "@material-symbols/svg-700/outlined/sync.svg";
import { useNavigate, useParams } from "@solidjs/router";
import { type Component, createMemo, createResource, createSignal, For, Show } from "solid-js";
import GitUpdateDialog from "../../components/GitUpdateDialog";
import ProcessDialog, { type ProcessFormValue } from "../../components/ProcessDialog";
import StatusChip from "../../components/StatusChip";
import TerminalView, { type Connection, type TerminalControls } from "../../components/TerminalView";
import { commandLine, formatDuration, formatTime } from "../../lib/format";
import { useProcesses } from "../../lib/ProcessesProvider";
import { routes } from "../../lib/routes";
import trpc from "../../lib/trpc";
import type { ProcessDto } from "../../lib/types";
import styles from "./Index.module.scss";

const KEYS: { label: string; data: string }[] = [
  { label: "Esc", data: "\x1b" },
  { label: "Tab", data: "\t" },
  { label: "Ctrl-C", data: "\x03" },
  { label: "Ctrl-D", data: "\x04" },
  { label: "↑", data: "\x1b[A" },
  { label: "↓", data: "\x1b[B" },
  { label: "←", data: "\x1b[D" },
  { label: "→", data: "\x1b[C" },
];

const REASONS: Record<string, string> = { "user-stop": "Stopped", exited: "Exited", crashed: "Crashed", "spawn-failed": "Failed to start" };

const download = (filename: string, text: string) => {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const Detail: Component<{ process: ProcessDto }> = (props) => {
  const { perform, act, notify } = useProcesses();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [connection, setConnection] = createSignal<Connection>("connecting");
  const [controls, setControls] = createSignal<TerminalControls>();
  const [editing, setEditing] = createSignal(false);
  const [deleting, setDeleting] = createSignal(false);
  const [updating, setUpdating] = createSignal(false);
  const [showInfo, setShowInfo] = createSignal(!isMobile());
  const [revealed, setRevealed] = createSignal(false);

  const p = () => props.process;
  const state = () => p().status.state;
  const active = () => ["running", "starting", "restarting", "stopping"].includes(state());
  const running = () => state() === "running";
  // the history is refetched when the state changes, so a crash shows up without a reload
  const [runs] = createResource(
    () => `${p().id}:${state()}`,
    () => trpc.runs.query({ id: p().id, limit: 8 }),
  );

  const lastExit = createMemo(() => {
    const { exitCode, signal } = p().status;

    return signal ? `Killed by ${signal}` : exitCode !== null ? `Exit code ${exitCode}` : undefined;
  });

  const save = async (value: ProcessFormValue) =>
    (await perform(() => trpc.update.mutate({ id: p().id, ...value }), "Saved. Restart the process to apply the changes.")) !== undefined;

  const remove = async () => {
    setDeleting(false);

    if ((await perform(() => trpc.delete.mutate({ id: p().id }), `Deleted ${p().name}`)) !== undefined) navigate(routes.list());
  };

  return (
    <div class={styles.page}>
      <div class={styles.header}>
        <UKIconButton icon={ARROW_BACK_ICON} alt="Back to processes" color="standard" onClick={() => navigate(routes.list())} />
        <div class={styles.title}>
          <UKText role="headline" size="s" class={styles.name}>
            {p().name}
          </UKText>
          <UKText role="body" size="s" class={styles.command}>
            {commandLine(p().executable, p().args)}
          </UKText>
        </div>
        <StatusChip state={state()} />
      </div>

      <div class={styles.actions}>
        <Show
          when={active()}
          fallback={
            <UKButton color="filled" size="s" leadingIcon={PLAY_ARROW_ICON} onClick={() => act(() => trpc.start.mutate({ id: p().id }))}>
              Start
            </UKButton>
          }
        >
          <UKButton color="tonal" size="s" leadingIcon={STOP_ICON} onClick={() => act(() => trpc.stop.mutate({ id: p().id }))}>
            Stop
          </UKButton>
          <UKButton color="outlined" size="s" leadingIcon={RESTART_ALT_ICON} onClick={() => act(() => trpc.restart.mutate({ id: p().id }))}>
            Restart
          </UKButton>
        </Show>
        <UKButton color="outlined" size="s" leadingIcon={EDIT_ICON} onClick={() => void setEditing(true)}>
          Edit
        </UKButton>
        <Show when={p().source === "git"}>
          <UKButton color="outlined" size="s" leadingIcon={SYNC_ICON} onClick={() => void setUpdating(true)}>
            Update from git
          </UKButton>
        </Show>
        <UKButton color="standard" size="s" leadingIcon={DELETE_ICON} onClick={() => void setDeleting(true)}>
          Delete
        </UKButton>
        <div class={styles.spacer} />
        <UKChip type="assist" onClick={() => setShowInfo(!showInfo())}>
          {showInfo() ? "Hide details" : "Details"}
        </UKChip>
      </div>

      <div class={styles.body}>
        <div class={styles.terminalColumn}>
          <div class={styles.toolbar}>
            <span class={styles.connection} data-state={connection()}>
              <UKText role="label" size="m">
                {connection() === "connected" ? "Connected" : connection() === "connecting" ? "Connecting…" : "Reconnecting…"}
              </UKText>
            </span>
            <Show when={!running() && connection() === "connected"}>
              <UKText role="label" size="m" class={styles.meta}>
                Not running, input is ignored. {lastExit() ?? ""}
              </UKText>
            </Show>
            <div class={styles.spacer} />
            <UKIconButton
              icon={CONTENT_COPY_ICON}
              alt="Copy selection"
              color="standard"
              onClick={() => {
                const text = controls()?.copy() ?? "";

                if (text) navigator.clipboard.writeText(text).then(() => notify("Copied"));
                else notify("Select some output first");
              }}
            />
            <UKIconButton
              icon={DELETE_SWEEP_ICON}
              alt="Clear terminal"
              color="standard"
              onClick={() => {
                controls()?.clear();
                trpc.clearLog.mutate({ id: p().id });
              }}
            />
            <UKIconButton
              icon={DOWNLOAD_ICON}
              alt="Download log"
              color="standard"
              onClick={async () => download(`${p().name}.log`, await trpc.logTail.query({ id: p().id }))}
            />
          </div>

          <TerminalView processId={p().id} onConnection={setConnection} controls={setControls} />

          <Show when={isMobile()}>
            <div class={styles.keys}>
              <For each={KEYS}>
                {(key) => (
                  <UKButton color="tonal" size="xs" onClick={() => controls()?.send(key.data)}>
                    {key.label}
                  </UKButton>
                )}
              </For>
            </div>
          </Show>
        </div>

        <Show when={showInfo()}>
          <div class={styles.side}>
            <UKCard color="filled" class={styles.panel}>
              <UKText role="title" size="m">
                Details
              </UKText>
              <dl class={styles.facts}>
                <dt>Executable</dt>
                <dd>{p().executable}</dd>
                <Show when={p().cwd}>
                  <dt>Working directory</dt>
                  <dd>{p().cwd}</dd>
                </Show>
                <Show when={p().status.pid}>
                  <dt>Process ID</dt>
                  <dd>{p().status.pid}</dd>
                </Show>
                <Show when={p().status.startedAt}>
                  <dt>Running for</dt>
                  <dd>{formatDuration(Date.now() - p().status.startedAt!)}</dd>
                </Show>
                <dt>Restart policy</dt>
                <dd>
                  {p().restartPolicy === "never" ? "Never" : `${p().restartPolicy === "always" ? "Always" : "On failure"}, up to ${p().maxRestarts} times`}
                </dd>
                <dt>Starts with the server</dt>
                <dd>{p().autoStart ? "Yes" : "No"}</dd>
                <dt>Crash notifications</dt>
                <dd>{p().notifyOnCrash ? "On" : "Off"}</dd>
                <Show when={p().source === "git"}>
                  <dt>Repository</dt>
                  <dd>
                    {p().gitUrl}
                    {p().gitRef ? ` (${p().gitRef})` : ""}
                  </dd>
                </Show>
              </dl>

              <div class={styles.envHeader}>
                <UKText role="title" size="s">
                  Environment
                </UKText>
                <Show when={Object.keys(p().env).length > 0}>
                  <UKButton color="standard" size="xs" onClick={() => void setRevealed(!revealed())}>
                    {revealed() ? "Hide values" : "Show values"}
                  </UKButton>
                </Show>
              </div>
              <Show
                when={Object.keys(p().env).length > 0}
                fallback={
                  <UKText role="body" size="s" class={styles.meta}>
                    None added
                  </UKText>
                }
              >
                <dl class={styles.facts}>
                  <For each={Object.entries(p().env)}>
                    {([key, value]) => (
                      <>
                        <dt>{key}</dt>
                        <dd>{revealed() ? value : "••••••••"}</dd>
                      </>
                    )}
                  </For>
                </dl>
              </Show>
            </UKCard>

            <UKCard color="filled" class={styles.panel}>
              <UKText role="title" size="m">
                Recent runs
              </UKText>
              <Show when={runs.loading && !runs.latest}>
                <UKCircularProgressIndicator />
              </Show>
              <Show when={runs.latest && runs.latest.length === 0}>
                <UKText role="body" size="s" class={styles.meta}>
                  Not run yet
                </UKText>
              </Show>
              <For each={runs.latest}>
                {(run) => (
                  <div class={styles.run}>
                    <UKText role="label" size="l">
                      {run.endedAt ? (REASONS[run.reason ?? ""] ?? "Ended") : "Running"}
                      {run.exitCode !== null ? ` (exit ${run.exitCode})` : run.signal ? ` (${run.signal})` : ""}
                    </UKText>
                    <UKText role="body" size="s" class={styles.meta}>
                      {formatTime(run.startedAt)}
                    </UKText>
                  </div>
                )}
              </For>
            </UKCard>
          </div>
        </Show>
      </div>

      <ProcessDialog show={editing} process={p()} onClose={() => setEditing(false)} onSave={save} />

      <Show when={p().source === "git"}>
        <GitUpdateDialog
          show={updating}
          processId={p().id}
          onClose={() => setUpdating(false)}
          onApplied={(updated) => notify(`Updated ${updated.join(", ")}. Restart to apply.`)}
        />
      </Show>

      <UKDialog show={deleting} onClose={() => setDeleting(false)} maxWidth="24rem" adaptToMobile>
        <div class={styles.confirm}>
          <UKText role="headline" size="s">
            Delete {p().name}?
          </UKText>
          <UKText role="body" size="m">
            {active() ? "It will be stopped first. " : ""}Its configuration and output are removed. This can't be undone.
          </UKText>
          <div class={styles.confirmActions}>
            <UKButton color="standard" size="s" onClick={() => void setDeleting(false)}>
              Cancel
            </UKButton>
            <UKButton color="filled" size="s" leadingIcon={DELETE_ICON} onClick={remove}>
              Delete
            </UKButton>
          </div>
        </div>
      </UKDialog>
    </div>
  );
};

const DetailPage: Component = () => {
  const params = useParams<{ id: string }>();
  const { processes, loading } = useProcesses();
  const navigate = useNavigate();
  const process = createMemo(() => processes()?.find((candidate) => candidate.id === params.id));

  return (
    <Show
      when={process()}
      fallback={
        <Show when={!loading() && processes()} fallback={<UKCircularProgressIndicator class={styles.spinner} />}>
          <div class={styles.missing}>
            <UKText role="title" size="l">
              That process doesn't exist
            </UKText>
            <UKButton color="tonal" size="s" onClick={() => navigate(routes.list())}>
              Back to processes
            </UKButton>
          </div>
        </Show>
      }
    >
      {(current) => <Detail process={current()} />}
    </Show>
  );
};

export default DetailPage;
