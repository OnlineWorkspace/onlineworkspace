import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKDialog from "@ewsgit/uikit-solid/src/components/dialog/UKDialog.tsx";
import UKSegmentedButton from "@ewsgit/uikit-solid/src/components/segmentedButton/UKSegmentedButton.tsx";
import UKSwitch from "@ewsgit/uikit-solid/src/components/switch/UKSwitch.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import UKTextField from "@ewsgit/uikit-solid/src/components/textField/UKTextField.tsx";
import { type Accessor, type Component, createSignal, Show } from "solid-js";
import type { ProcessDto } from "../lib/types";
import { type ArgRow, ArgsEditor, argRows, EnvEditor, type EnvRow, envRows } from "./ListEditors";
import styles from "./ProcessDialog.module.scss";

export interface ProcessFormValue {
  name: string;
  executable: string;
  args: string[];
  env: Record<string, string>;
  cwd: string | null;
  autoStart: boolean;
  restartPolicy: "never" | "on-failure" | "always";
  maxRestarts: number;
  notifyOnCrash: boolean;
}

const ProcessForm: Component<{ process?: ProcessDto; onClose: () => void; onSave: (value: ProcessFormValue) => Promise<boolean> }> = (props) => {
  const p = props.process;
  const [name, setName] = createSignal(p?.name ?? "");
  const [executable, setExecutable] = createSignal(p?.executable ?? "");
  const [cwd, setCwd] = createSignal(p?.cwd ?? "");
  const [autoStart, setAutoStart] = createSignal(p?.autoStart ?? false);
  const [notifyOnCrash, setNotifyOnCrash] = createSignal(p?.notifyOnCrash ?? true);
  const [policy, setPolicy] = createSignal<string>(p?.restartPolicy ?? "never");
  const [maxRestarts, setMaxRestarts] = createSignal(String(p?.maxRestarts ?? 5));
  const [args, setArgs] = createSignal<ArgRow[]>(argRows(p?.args ?? []));
  const [env, setEnv] = createSignal<EnvRow[]>(envRows(p?.env ?? {}));
  const [saving, setSaving] = createSignal(false);
  const [submitted, setSubmitted] = createSignal(false);

  const envInvalid = () => env().some((row) => row.key === "" || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(row.key));
  const restartsInvalid = () => !/^\d+$/.test(maxRestarts()) || Number(maxRestarts()) > 100;
  const valid = () => name().trim() !== "" && executable().trim() !== "" && !envInvalid() && !restartsInvalid();

  const save = async () => {
    setSubmitted(true);

    if (!valid()) return;

    setSaving(true);

    const saved = await props.onSave({
      name: name().trim(),
      executable: executable().trim(),
      args: args().map((row) => row.value),
      env: Object.fromEntries(env().map((row) => [row.key, row.value])),
      cwd: cwd().trim() || null,
      autoStart: autoStart(),
      restartPolicy: policy() as ProcessFormValue["restartPolicy"],
      maxRestarts: Number(maxRestarts()),
      notifyOnCrash: notifyOnCrash(),
    });

    setSaving(false);

    if (saved) props.onClose();
  };

  return (
    <div class={styles.form}>
      <UKText role="headline" size="s">
        {p ? "Edit process" : "Add process"}
      </UKText>
      <UKText role="body" size="s" class={styles.warning}>
        Processes run on the server with the same permissions as Online Workspace itself.
      </UKText>

      <div class={styles.columns}>
        <div class={styles.column}>
          <UKTextField
            color="outlined"
            label="Name"
            value={name()}
            onValueChange={setName}
            error={submitted() && name().trim() === ""}
            supportingText={submitted() && name().trim() === "" ? "Give it a name" : undefined}
          />
          <UKTextField
            color="outlined"
            label="Executable"
            value={executable()}
            onValueChange={setExecutable}
            error={submitted() && executable().trim() === ""}
            supportingText={submitted() && executable().trim() === "" ? "Enter a path, e.g. /usr/bin/node" : "A path, or a program name found on the PATH"}
          />
          <UKTextField
            color="outlined"
            label="Working directory (optional)"
            value={cwd()}
            onValueChange={setCwd}
            supportingText="Defaults to the server's working directory"
          />

          <div class={styles.switchRow}>
            <UKText role="body" size="l">
              Start when the server starts
            </UKText>
            <UKSwitch value={autoStart()} onValueChange={setAutoStart} />
          </div>
          <div class={styles.switchRow}>
            <UKText role="body" size="l">
              Notify me if it stops unexpectedly
            </UKText>
            <UKSwitch value={notifyOnCrash()} onValueChange={setNotifyOnCrash} />
          </div>

          <UKText role="title" size="s">
            If it stops unexpectedly
          </UKText>
          <UKSegmentedButton
            items={[
              { id: "never", label: "Never restart" },
              { id: "on-failure", label: "On failure" },
              { id: "always", label: "Always" },
            ]}
            selectedId={policy}
            onSelect={setPolicy}
          />
          <Show when={policy() !== "never"}>
            <UKTextField
              color="outlined"
              label="Give up after (restarts)"
              value={maxRestarts()}
              onValueChange={setMaxRestarts}
              error={restartsInvalid()}
              supportingText={restartsInvalid() ? "A number from 0 to 100" : "Restarts wait longer each time, up to a minute"}
            />
          </Show>
        </div>

        <div class={styles.column}>
          <ArgsEditor rows={args()} onChange={setArgs} />
          <EnvEditor rows={env()} onChange={setEnv} />
        </div>
      </div>

      <div class={styles.actions}>
        <UKButton color="standard" size="s" onClick={props.onClose}>
          Cancel
        </UKButton>
        <UKButton color="filled" size="s" onClick={save}>
          {saving() ? "Saving…" : "Save"}
        </UKButton>
      </div>
    </div>
  );
};

const ProcessDialog: Component<{
  show: Accessor<boolean>;
  process?: ProcessDto;
  onClose: () => void;
  onSave: (value: ProcessFormValue) => Promise<boolean>;
}> = (props) => (
  <UKDialog show={props.show} onClose={props.onClose} maxWidth="56rem" adaptToMobile>
    <ProcessForm process={props.process} onClose={props.onClose} onSave={props.onSave} />
  </UKDialog>
);

export default ProcessDialog;
