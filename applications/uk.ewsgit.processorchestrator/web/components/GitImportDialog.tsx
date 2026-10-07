import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.tsx";
import UKCircularProgressIndicator from "@ewsgit/uikit-solid/src/components/circularProgressIndicator/UKCircularProgressIndicator.tsx";
import UKDialog from "@ewsgit/uikit-solid/src/components/dialog/UKDialog.tsx";
import UKIcon from "@ewsgit/uikit-solid/src/components/icon/UKIcon.tsx";
import UKSwitch from "@ewsgit/uikit-solid/src/components/switch/UKSwitch.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import UKTextField from "@ewsgit/uikit-solid/src/components/textField/UKTextField.tsx";
import WARNING_ICON from "@material-symbols/svg-700/outlined/warning.svg";
import { type Accessor, type Component, createMemo, createSignal, For, Show } from "solid-js";
import { commandLine, errorMessage } from "../lib/format";
import trpc from "../lib/trpc";
import styles from "./GitImportDialog.module.scss";

type Preview = Awaited<ReturnType<typeof trpc.previewGit.mutate>>;

const GitImportForm: Component<{ onClose: () => void; onImported: (names: string[]) => void }> = (props) => {
  const [url, setUrl] = createSignal("");
  const [ref, setRef] = createSignal("");
  const [subdir, setSubdir] = createSignal("");
  const [busy, setBusy] = createSignal<"fetching" | "importing">();
  const [error, setError] = createSignal<string>();
  const [preview, setPreview] = createSignal<Preview>();
  const [selected, setSelected] = createSignal<Set<string>>(new Set());

  const target = () => ({ url: url().trim(), ref: ref().trim() || null, subdir: subdir().trim() || null });
  const chosen = createMemo(() => (preview() ?? []).filter((entry) => selected().has(entry.name)));
  const steps = createMemo(() => chosen().flatMap((entry) => entry.steps.map((command) => ({ process: entry.name, command }))));

  const fetchRepo = async () => {
    setError(undefined);

    if (target().url === "") {
      setError("Enter the clone URL of the repository");
      return;
    }

    setBusy("fetching");

    try {
      const result = await trpc.previewGit.mutate(target());

      setPreview(result);
      setSelected(new Set(result.filter((entry) => !entry.alreadyImported).map((entry) => entry.name)));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(undefined);
    }
  };

  const importSelected = async () => {
    setError(undefined);
    setBusy("importing");

    try {
      const result = await trpc.importGit.mutate({ ...target(), names: chosen().map((entry) => entry.name) });

      props.onImported(result.created);
      props.onClose();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(undefined);
    }
  };

  const toggle = (name: string, on: boolean) =>
    setSelected((current) => {
      const next = new Set(current);

      if (on) next.add(name);
      else next.delete(name);

      return next;
    });

  return (
    <div class={styles.form}>
      <UKText role="headline" size="s">
        Add from a git repository
      </UKText>
      <UKText role="body" size="s" class={styles.hint}>
        The repository's processorchestrator.json describes the processes to add. Nothing is run until you confirm.
      </UKText>

      <Show
        when={preview()}
        fallback={
          <>
            <UKTextField
              color="outlined"
              label="Clone URL"
              value={url()}
              onValueChange={setUrl}
              onSubmit={fetchRepo}
              supportingText="https://, ssh:// or git@host:path"
            />
            <div class={styles.pair}>
              <UKTextField color="outlined" label="Branch or tag (optional)" value={ref()} onValueChange={setRef} />
              <UKTextField
                color="outlined"
                label="Folder (optional)"
                value={subdir()}
                onValueChange={setSubdir}
                supportingText="Where processorchestrator.json is, if not the root"
              />
            </div>
          </>
        }
      >
        {(entries) => (
          <>
            <UKText role="title" size="s">
              Found {entries().length} {entries().length === 1 ? "process" : "processes"}
            </UKText>
            <div class={styles.entries}>
              <For each={entries()}>
                {(entry) => (
                  <UKCard color="outlined" class={styles.entry}>
                    <div class={styles.entryText}>
                      <UKText role="title" size="m">
                        {entry.name}
                      </UKText>
                      <UKText role="body" size="s" class={styles.mono}>
                        {commandLine(entry.executable, entry.args)}
                      </UKText>
                      <UKText role="body" size="s" class={styles.hint}>
                        {entry.alreadyImported ? "Already added from this repository. " : ""}
                        {entry.autoStart ? "Starts automatically. " : ""}
                        {Object.keys(entry.env).length > 0 ? `${Object.keys(entry.env).length} environment variables. ` : ""}
                        Restart policy: {entry.restartPolicy}.
                      </UKText>
                    </div>
                    <UKSwitch value={selected().has(entry.name)} onValueChange={(on) => toggle(entry.name, on)} disabled={entry.alreadyImported} />
                  </UKCard>
                )}
              </For>
            </div>

            <Show when={steps().length > 0}>
              <UKCard color="filled" class={styles.stepsCard}>
                <div class={styles.stepsHeader}>
                  <UKIcon>{WARNING_ICON}</UKIcon>
                  <UKText role="title" size="s">
                    These commands will be run on the server
                  </UKText>
                </div>
                <For each={steps()}>
                  {(step) => (
                    <UKText role="body" size="s" class={styles.mono}>
                      {step.process}: {step.command}
                    </UKText>
                  )}
                </For>
              </UKCard>
            </Show>
          </>
        )}
      </Show>

      <Show when={error()}>
        <UKText role="body" size="m" class={styles.error}>
          {error()}
        </UKText>
      </Show>

      <div class={styles.actions}>
        <Show when={busy()}>
          <UKCircularProgressIndicator />
          <UKText role="body" size="s" class={styles.hint}>
            {busy() === "fetching" ? "Cloning the repository…" : "Running install and build steps, this can take a while…"}
          </UKText>
        </Show>
        <div class={styles.spacer} />
        <Show when={preview()}>
          <UKButton color="standard" size="s" onClick={() => setPreview(undefined)}>
            Back
          </UKButton>
        </Show>
        <UKButton color="standard" size="s" onClick={props.onClose}>
          Cancel
        </UKButton>
        <Show
          when={preview()}
          fallback={
            <UKButton color="filled" size="s" onClick={fetchRepo}>
              Fetch
            </UKButton>
          }
        >
          <UKButton color="filled" size="s" onClick={importSelected}>
            {chosen().length === 1 ? "Add 1 process" : `Add ${chosen().length} processes`}
          </UKButton>
        </Show>
      </div>
    </div>
  );
};

const GitImportDialog: Component<{ show: Accessor<boolean>; onClose: () => void; onImported: (names: string[]) => void }> = (props) => (
  <UKDialog show={props.show} onClose={props.onClose} maxWidth="40rem" adaptToMobile>
    <GitImportForm onClose={props.onClose} onImported={props.onImported} />
  </UKDialog>
);

export default GitImportDialog;
