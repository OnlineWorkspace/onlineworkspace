import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKCircularProgressIndicator from "@ewsgit/uikit-solid/src/components/circularProgressIndicator/UKCircularProgressIndicator.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import UKTextField from "@ewsgit/uikit-solid/src/components/textField/UKTextField.tsx";
import { type Component, createSignal, Show } from "solid-js";
import type { SetStoreFunction } from "solid-js/store";
import trpc from "../../../lib/trpc";
import ChoiceStep, { FieldError, type StepNavigation } from "../components/ChoiceStep/ChoiceStep";
import SettingRow from "../components/SettingRow/SettingRow";
import Summary from "../components/Summary/Summary";
import styles from "../Setup.module.scss";
import type { DatabaseForm, DatabaseInfo } from "../state";

/** the database is the one thing the instance cannot run without, and it is set up while the backend is in setup mode */
const Database: Component<
  Pick<StepNavigation, "onBack"> & {
    token: string;
    info: DatabaseInfo;
    form: DatabaseForm;
    setForm: SetStoreFunction<DatabaseForm>;
    custom: boolean;
    onCustomChange(custom: boolean): void;
    /** saves the database and waits for the backend to restart, resolves to the reason it failed */
    connect(): Promise<string | undefined>;
    /** checks the current database again, for when it has been started or fixed since the page was opened */
    recheck(): Promise<void>;
  }
> = (props) => {
  const [busy, setBusy] = createSignal(false);
  const [error, setError] = createSignal<string>();
  const [testResult, setTestResult] = createSignal<{ ok: boolean; message: string }>();

  const test = async () => {
    setBusy(true);
    setTestResult(undefined);

    try {
      const result = await trpc.setup.database.test.mutate({ token: props.token, postgres: toInput() });
      setTestResult(
        result.ok
          ? { ok: true, message: "Connected to the database" }
          : { ok: false, message: result.missingDatabase ? (props.form.createIfMissing ? "The database does not exist yet, it will be created" : "The database does not exist") : (result.error ?? "The database could not be reached") },
      );
    } catch (err) {
      setTestResult({ ok: false, message: err instanceof Error ? err.message : "The test failed" });
    } finally {
      setBusy(false);
    }
  };

  const [rechecking, setRechecking] = createSignal(false);

  const recheck = async () => {
    setRechecking(true);
    setError(undefined);

    try {
      await props.recheck();
    } catch (err) {
      setError(err instanceof Error ? err.message : "The database could not be checked");
    } finally {
      setRechecking(false);
    }
  };

  const toInput = () => ({ host: props.form.host, port: props.form.port, user: props.form.user, password: props.form.password, keepExistingPassword: props.form.keepExistingPassword, database: props.form.database });

  const next = async () => {
    setError(undefined);
    setBusy(true);
    setError(await props.connect());
    setBusy(false);
  };

  const valid = () => props.form.host.trim() !== "" && props.form.port > 0 && props.form.port <= 65535 && props.form.user.trim() !== "" && props.form.database.trim() !== "";

  const status = (
    <>
      <FieldError message={error()} />
      <Show when={busy()}>
        <div class={styles.busy}>
          <UKCircularProgressIndicator />
          <UKText role={"body"} size={"m"} align={"start"} class={styles.subtle}>
            Setting up the database and restarting the backend, this can take a minute...
          </UKText>
        </div>
      </Show>
    </>
  );

  return (
    <ChoiceStep
      title={"Database"}
      description={"OnlineWorkspace stores its users and settings in a PostgreSQL database."}
      recommendedLabel={"Current settings"}
      custom={props.custom}
      onCustomChange={props.onCustomChange}
      canContinue={!busy() && (props.custom ? valid() : props.info.connected)}
      onNext={next}
      onBack={props.onBack}
      summary={
        <>
          <Summary
            rows={[
              ["Host", `${props.info.host}:${props.info.port}`],
              ["Database", props.info.database],
              ["User", props.info.user],
              ["Status", props.info.connected ? "Connected" : props.info.missingDatabase ? "The database does not exist" : (props.info.error ?? "Not reachable")],
            ]}
          />
          <Show when={!props.info.connected}>
            <UKText role={"body"} size={"m"} align={"start"} class={styles.subtle}>
              The current settings can't be used. Choose Customise to enter the connection details of your PostgreSQL server, or start the database and check again.
            </UKText>
          </Show>
          <UKButton color={"outlined"} disabled={busy() || rechecking()} onClick={recheck}>
            {rechecking() ? "Checking..." : "Recheck"}
          </UKButton>
          {status}
        </>
      }
    >
      <Show when={props.info.environmentOverride}>
        <UKText role={"body"} size={"m"} align={"start"} class={styles.subtle}>
          Some of these settings are set by ONLINEWORKSPACE_POSTGRES_* environment variables, which always take priority over what is entered here.
        </UKText>
      </Show>
      <UKTextField color={"outlined"} label={"Host"} defaultValue={props.form.host} onValueChange={(v) => props.setForm("host", v.trim())} error={props.form.host.trim() === ""} />
      <UKTextField color={"outlined"} label={"Port"} defaultValue={String(props.form.port)} onValueChange={(v) => props.setForm("port", Number.parseInt(v, 10) || 0)} error={props.form.port <= 0 || props.form.port > 65535} />
      <UKTextField color={"outlined"} label={"Database name"} supportingText={"Letters, numbers and underscores"} defaultValue={props.form.database} onValueChange={(v) => props.setForm("database", v.trim())} error={props.form.database.trim() === ""} />
      <UKTextField color={"outlined"} label={"Username"} defaultValue={props.form.user} onValueChange={(v) => props.setForm("user", v.trim())} autocomplete={"off"} error={props.form.user.trim() === ""} />
      <UKTextField
        shouldMask={true}
        color={"outlined"}
        label={"Password"}
        supportingText={props.info.hasPassword ? "Leave blank to keep the current password" : undefined}
        defaultValue={props.form.password}
        onValueChange={(v) => {
          props.setForm("password", v);
          props.setForm("keepExistingPassword", v === "" && props.info.hasPassword);
        }}
        autocomplete={"off"}
      />
      <SettingRow label={"Create the database if it doesn't exist"} supporting={"The user needs permission to create databases"} value={props.form.createIfMissing} onValueChange={(v) => props.setForm("createIfMissing", v)} />
      <UKButton color={"outlined"} disabled={busy() || !valid()} onClick={test}>
        Test connection
      </UKButton>
      <Show when={testResult()}>
        <UKText role={"body"} size={"m"} align={"start"} class={testResult()?.ok ? styles.subtle : styles.error}>
          {testResult()?.message}
        </UKText>
      </Show>
      {status}
    </ChoiceStep>
  );
};

export default Database;
