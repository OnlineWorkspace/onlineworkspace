import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKCircularProgressIndicator from "@ewsgit/uikit-solid/src/components/circularProgressIndicator/UKCircularProgressIndicator.tsx";
import UKDialog from "@ewsgit/uikit-solid/src/components/dialog/UKDialog.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import { type Accessor, type Component, createResource, createSignal, For, Show } from "solid-js";
import { errorMessage } from "../lib/format";
import trpc from "../lib/trpc";
import styles from "./GitImportDialog.module.scss";

const UpdateForm: Component<{ processId: string; onClose: () => void; onApplied: (updated: string[]) => void }> = (props) => {
  const [check] = createResource(() => trpc.checkGitUpdate.mutate({ id: props.processId }).catch((e) => ({ failure: errorMessage(e) }) as const));
  const [applying, setApplying] = createSignal(false);
  const [error, setError] = createSignal<string>();

  const result = () => {
    const value = check();

    return value && "entries" in value ? value : undefined;
  };
  const failure = () => {
    const value = check();

    return value && "failure" in value ? value.failure : undefined;
  };
  const anyChange = () => result()?.entries.some((entry) => entry.status !== "unchanged") ?? false;

  const apply = async () => {
    setApplying(true);
    setError(undefined);

    try {
      props.onApplied((await trpc.applyGitUpdate.mutate({ id: props.processId })).updated);
      props.onClose();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setApplying(false);
    }
  };

  return (
    <div class={styles.form}>
      <UKText role="headline" size="s">
        Update from git
      </UKText>
      <Show when={check.loading}>
        <div class={styles.actions}>
          <UKCircularProgressIndicator />
          <UKText role="body" size="s" class={styles.hint}>
            Pulling the repository…
          </UKText>
        </div>
      </Show>
      <Show when={failure()}>
        <UKText role="body" size="m" class={styles.error}>
          {failure()}
        </UKText>
      </Show>
      <Show when={result()}>
        {(r) => (
          <>
            <UKText role="body" size="s" class={styles.hint}>
              {anyChange() ? "These changes will be applied. Running processes keep going until you restart them." : "Everything is already up to date."}
            </UKText>
            <For each={r().entries}>
              {(entry) => (
                <div class={styles.entryText}>
                  <UKText role="title" size="m">
                    {entry.name}
                  </UKText>
                  <UKText role="body" size="s" class={styles.hint}>
                    {entry.status === "new"
                      ? "New in the repository, not added by this update"
                      : entry.status === "changed"
                        ? `Changed: ${entry.changes.join(", ")}`
                        : "Unchanged"}
                  </UKText>
                  <Show when={entry.status === "changed" && entry.steps.length > 0}>
                    <UKText role="body" size="s" class={styles.mono}>
                      Runs: {entry.steps.join("; ")}
                    </UKText>
                  </Show>
                </div>
              )}
            </For>
            <Show when={r().removed.length > 0}>
              <UKText role="body" size="s" class={styles.hint}>
                No longer in the repository (left as they are): {r().removed.join(", ")}
              </UKText>
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
        <Show when={applying()}>
          <UKCircularProgressIndicator />
        </Show>
        <div class={styles.spacer} />
        <UKButton color="standard" size="s" onClick={props.onClose}>
          Close
        </UKButton>
        <Show when={anyChange()}>
          <UKButton color="filled" size="s" onClick={apply}>
            Apply changes
          </UKButton>
        </Show>
      </div>
    </div>
  );
};

const GitUpdateDialog: Component<{ show: Accessor<boolean>; processId: string; onClose: () => void; onApplied: (updated: string[]) => void }> = (props) => (
  <UKDialog show={props.show} onClose={props.onClose} maxWidth="36rem" adaptToMobile>
    <UpdateForm processId={props.processId} onClose={props.onClose} onApplied={props.onApplied} />
  </UKDialog>
);

export default GitUpdateDialog;
