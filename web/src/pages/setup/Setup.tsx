import APPS_ICON from "@material-symbols/svg-700/outlined/apps.svg";
import BADGE_ICON from "@material-symbols/svg-700/outlined/badge.svg";
import CHECK_ICON from "@material-symbols/svg-700/outlined/check.svg";
import DATABASE_ICON from "@material-symbols/svg-700/outlined/database.svg";
import DESCRIPTION_ICON from "@material-symbols/svg-700/outlined/description.svg";
import GROUP_ICON from "@material-symbols/svg-700/outlined/group.svg";
import LANGUAGE_ICON from "@material-symbols/svg-700/outlined/language.svg";
import MAIL_ICON from "@material-symbols/svg-700/outlined/mail.svg";
import ADMIN_ICON from "@material-symbols/svg-700/outlined/admin_panel_settings.svg";
import SHIELD_ICON from "@material-symbols/svg-700/outlined/shield.svg";
import TASK_ICON from "@material-symbols/svg-700/outlined/task_alt.svg";
import WAVING_HAND_ICON from "@material-symbols/svg-700/outlined/waving_hand.svg";
import UKIcon from "@ewsgit/uikit-solid/src/components/icon/UKIcon.tsx";
import UKLinearProgressIndicator from "@ewsgit/uikit-solid/src/components/linearProgressIndicator/UKLinearProgressIndicator.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import { type Component, createEffect, createSignal, For, Match, Switch } from "solid-js";
import { createStore, reconcile, unwrap } from "solid-js/store";
import trpc from "../../lib/trpc";
import styles from "./Setup.module.scss";
import { type DatabaseForm, type DatabaseInfo, initialDatabaseForm, initialState, type ResettableStep, type SetupDefaults, type SetupState } from "./state";
import Access from "./steps/Access";
import Address from "./steps/Address";
import Administrator from "./steps/Administrator";
import Applications from "./steps/Applications";
import Database from "./steps/Database";
import Identity from "./steps/Identity";
import Mail from "./steps/Mail";
import NewUsers from "./steps/NewUsers";
import Review from "./steps/Review";
import Terms from "./steps/Terms";
import Welcome from "./steps/Welcome";

/** the steps in order, `reset` is the part of the state which the "Recommended" choice restores */
const STEPS: { id: string; icon: string; label: string; reset?: ResettableStep }[] = [
  { id: "welcome", icon: WAVING_HAND_ICON, label: "Welcome" },
  { id: "database", icon: DATABASE_ICON, label: "Database" },
  { id: "identity", icon: BADGE_ICON, label: "Identity", reset: "identity" },
  { id: "address", icon: LANGUAGE_ICON, label: "Address", reset: "address" },
  { id: "mail", icon: MAIL_ICON, label: "Email", reset: "mailServer" },
  { id: "access", icon: SHIELD_ICON, label: "Security", reset: "access" },
  { id: "administrator", icon: ADMIN_ICON, label: "Administrator" },
  { id: "newUsers", icon: GROUP_ICON, label: "New users", reset: "newUsers" },
  { id: "applications", icon: APPS_ICON, label: "Applications", reset: "applications" },
  { id: "terms", icon: DESCRIPTION_ICON, label: "Terms of use", reset: "termsOfUse" },
  { id: "review", icon: TASK_ICON, label: "Review" },
];

/** the instance setup wizard, shown at `/` until the instance has been set up */
const Setup: Component = () => {
  const [state, setState] = createStore<SetupState>({} as SetupState);
  const [stepIndex, setStepIndex] = createSignal(0);
  const [token, setToken] = createSignal("");
  const [defaults, setDefaults] = createSignal<SetupDefaults>();
  const [databaseInfo, setDatabaseInfo] = createSignal<DatabaseInfo>();
  const [databaseForm, setDatabaseForm] = createStore<DatabaseForm>({} as DatabaseForm);
  // the backend is in setup mode (without a database) until the database step is passed
  const [mode, setMode] = createSignal<"setup" | "full" | "auto">("setup");
  const [customised, setCustomised] = createSignal<Record<string, boolean>>({});
  // a copy of the recommended values, for restoring them
  let baseline: SetupState | undefined;

  // email can only be required when there is a mail server to send the codes
  createEffect(() => {
    if (defaults() && !state.mailServer.enabled && state.access.requireEmail) setState("access", "requireEmail", false);
  });

  const step = () => STEPS[stepIndex()];
  const goTo = (id: string) => setStepIndex(Math.max(0, STEPS.findIndex((s) => s.id === id)));

  const verified = async (givenToken: string) => {
    const { valid } = await trpc.setup.verifyToken.mutate({ token: givenToken });
    if (!valid) throw new Error("That setup token is incorrect");

    const info = await trpc.setup.database.current.query({ token: givenToken });
    setMode((await trpc.setup.status.query()).mode);
    setDatabaseInfo(info);
    setDatabaseForm(reconcile(initialDatabaseForm(info)));
    // there's nothing to confirm when the current database doesn't work
    setCustomised((c) => ({ ...c, database: !info.connected }));
    setToken(givenToken);
    setStepIndex(1);
  };

  /** the rest of the wizard needs the backend's full mode, as it is what knows the defaults */
  const loadDefaults = async (): Promise<string | undefined> => {
    try {
      const fetched = await trpc.setup.defaults.query({ token: token() });
      baseline = initialState(fetched);
      setState(reconcile(structuredClone(baseline)));
      setDefaults(fetched);
      setStepIndex(stepIndex() + 1);
      return undefined;
    } catch (err) {
      return err instanceof Error ? err.message : "The setup defaults could not be loaded";
    }
  };

  /** waits for the backend to come back up after it restarts, it is unreachable for a while */
  const waitForFullMode = async () => {
    const deadline = Date.now() + 3 * 60 * 1000;

    while (Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      try {
        const status = await trpc.setup.status.query();

        if (status.mode === "full") {
          setMode("full");
          return true;
        }
      } catch {
        // the backend is restarting
      }
    }

    return false;
  };

  const connectDatabase = async (): Promise<string | undefined> => {
    const info = databaseInfo()!;
    const useCurrent = customised().database !== true;

    if (!(useCurrent && info.connected && mode() === "full")) {
      try {
        const result = await trpc.setup.database.apply.mutate({
          token: token(),
          createIfMissing: useCurrent ? false : databaseForm.createIfMissing,
          postgres: useCurrent
            ? { host: info.host, port: info.port, user: info.user, password: "", keepExistingPassword: true, database: info.database }
            : { host: databaseForm.host, port: databaseForm.port, user: databaseForm.user, password: databaseForm.password, keepExistingPassword: databaseForm.keepExistingPassword, database: databaseForm.database },
        });

        if (result.type === "error") return result.missingDatabase && !databaseForm.createIfMissing ? `${result.message}. Turn on "Create the database if it doesn't exist" to have it created.` : result.message;

        if (result.restarting && !(await waitForFullMode())) return "The backend did not come back after restarting, check the server's console";
      } catch (err) {
        return err instanceof Error ? err.message : "The database could not be set up";
      }
    }

    return loadDefaults();
  };

  const apply = async (): Promise<string | undefined> => {
    const { confirmPassword: _confirm, email, ...administrator } = unwrap(state).administrator;

    try {
      const result = await trpc.setup.complete.mutate({
        token: token(),
        identity: { ...state.identity },
        administrator: { ...administrator, email: email || undefined },
        address: { ...state.address },
        access: { ...state.access, passwordContains: { ...state.access.passwordContains } },
        mailServer: structuredClone(unwrap(state).mailServer),
        newUsers: { ...state.newUsers, homeDirectories: [...state.newUsers.homeDirectories] },
        applications: { enabled: [...state.applications.enabled], quickShortcuts: [...state.applications.quickShortcuts] },
        termsOfUse: state.termsOfUse,
      });

      if (result.type === "error") return result.message;

      // a full load so everything is fetched again now the instance is set up
      window.location.assign(result.signedIn ? "/app" : "/auth/login");
      return undefined;
    } catch (err) {
      return err instanceof Error ? err.message : "The setup could not be completed";
    }
  };

  const props = (index: number) => {
    const current = STEPS[index];

    return {
      state,
      setState,
      defaults: defaults()!,
      token: token(),
      custom: customised()[current.id] === true,
      onCustomChange: (custom: boolean) => {
        setCustomised((c) => ({ ...c, [current.id]: custom }));
        // choosing the recommended option discards any changes
        if (!custom && current.reset && baseline) setState(current.reset, reconcile(structuredClone(baseline[current.reset]) as never));
      },
      // the database can't be gone back to, the backend has restarted with it
      onBack: index > 2 ? () => setStepIndex(index - 1) : undefined,
      onNext: () => setStepIndex(index + 1),
    };
  };

  return (
    <div class={styles.root}>
      <aside class={styles.rail}>
        <div class={styles.brand}>
          <UKText role={"label"} size={"l"} emphasized={true} align={"start"} class={styles.eyebrow}>
            OnlineWorkspace
          </UKText>
          <UKText role={"headline"} size={"l"} emphasized={true} align={"start"}>
            Set up your workspace
          </UKText>
        </div>
        <ol class={styles.stepper}>
          <For each={STEPS}>
            {(s, index) => (
              <li class={styles.step} data-state={index() < stepIndex() ? "done" : index() === stepIndex() ? "current" : "todo"} aria-current={index() === stepIndex() ? "step" : undefined}>
                <span class={styles.marker}>
                  <UKIcon>{index() < stepIndex() ? CHECK_ICON : s.icon}</UKIcon>
                </span>
                <UKText role={"label"} size={"l"} emphasized={index() === stepIndex()} align={"start"}>
                  {s.label}
                </UKText>
              </li>
            )}
          </For>
        </ol>
        <div class={styles.progress} role={"progressbar"} aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={stepIndex() + 1}>
          <UKText role={"label"} size={"m"} align={"start"} class={styles.subtle}>
            {`Step ${stepIndex() + 1} of ${STEPS.length} · ${step().label}`}
          </UKText>
          <UKLinearProgressIndicator start={0} stop={STEPS.length} value={stepIndex() + 1} />
        </div>
      </aside>
      <main class={styles.main}>
        <Switch>
          <Match when={step().id === "welcome"}>
            <Welcome onVerified={verified} />
          </Match>
            <Match when={databaseInfo() && step().id === "database"}>
            <Database
              token={token()}
              info={databaseInfo()!}
              form={databaseForm}
              setForm={setDatabaseForm}
              custom={customised().database === true}
              onCustomChange={(custom) => {
                setCustomised((c) => ({ ...c, database: custom }));
                if (!custom) setDatabaseForm(reconcile(initialDatabaseForm(databaseInfo()!)));
              }}
              connect={connectDatabase}
              recheck={async () => {
                setDatabaseInfo(await trpc.setup.database.current.query({ token: token() }));
              }}
            />
          </Match>
          <Match when={defaults() && step().id === "identity"}>
              <Identity {...props(stepIndex())} />
            </Match>
            <Match when={defaults() && step().id === "address"}>
              <Address {...props(stepIndex())} />
            </Match>
            <Match when={defaults() && step().id === "mail"}>
              <Mail {...props(stepIndex())} />
            </Match>
            <Match when={defaults() && step().id === "access"}>
              <Access {...props(stepIndex())} />
            </Match>
            <Match when={defaults() && step().id === "administrator"}>
              <Administrator {...props(stepIndex())} />
            </Match>
            <Match when={defaults() && step().id === "newUsers"}>
              <NewUsers {...props(stepIndex())} />
            </Match>
            <Match when={defaults() && step().id === "applications"}>
              <Applications {...props(stepIndex())} />
            </Match>
            <Match when={defaults() && step().id === "terms"}>
              <Terms {...props(stepIndex())} />
            </Match>
            <Match when={defaults() && step().id === "review"}>
              <Review {...props(stepIndex())} goTo={goTo} apply={apply} nextLabel={"Finish setup"} />
            </Match>
        </Switch>
      </main>
    </div>
  );
};

export default Setup;
