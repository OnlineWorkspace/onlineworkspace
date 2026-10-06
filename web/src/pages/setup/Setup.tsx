import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import { type Component, createEffect, createSignal, Match, Switch } from "solid-js";
import { createStore, reconcile, unwrap } from "solid-js/store";
import trpc from "../../lib/trpc";
import StepIndicator from "../auth/signup/components/StepIndicator/StepIndicator";
import styles from "./Setup.module.scss";
import { initialState, type ResettableStep, type SetupDefaults, type SetupState } from "./state";
import Access from "./steps/Access";
import Address from "./steps/Address";
import Administrator from "./steps/Administrator";
import Applications from "./steps/Applications";
import Identity from "./steps/Identity";
import Mail from "./steps/Mail";
import NewUsers from "./steps/NewUsers";
import Review from "./steps/Review";
import Terms from "./steps/Terms";
import Welcome from "./steps/Welcome";

/** the steps in order, `reset` is the part of the state which the "Recommended" choice restores */
const STEPS: { id: string; label: string; reset?: ResettableStep }[] = [
  { id: "welcome", label: "Welcome" },
  { id: "identity", label: "Identity", reset: "identity" },
  { id: "address", label: "Address", reset: "address" },
  { id: "mail", label: "Email", reset: "mailServer" },
  { id: "access", label: "Security", reset: "access" },
  { id: "administrator", label: "Administrator" },
  { id: "newUsers", label: "New users", reset: "newUsers" },
  { id: "applications", label: "Applications", reset: "applications" },
  { id: "terms", label: "Terms of use", reset: "termsOfUse" },
  { id: "review", label: "Review" },
];

/** the instance setup wizard, shown at `/` until the instance has been set up */
const Setup: Component = () => {
  const [state, setState] = createStore<SetupState>({} as SetupState);
  const [stepIndex, setStepIndex] = createSignal(0);
  const [token, setToken] = createSignal("");
  const [defaults, setDefaults] = createSignal<SetupDefaults>();
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

    const fetched = await trpc.setup.defaults.query({ token: givenToken });
    baseline = initialState(fetched);
    setState(reconcile(structuredClone(baseline)));
    setToken(givenToken);
    setDefaults(fetched);
    setStepIndex(1);
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
      onBack: index > 1 ? () => setStepIndex(index - 1) : undefined,
      onNext: () => setStepIndex(index + 1),
    };
  };

  return (
    <div class={styles.root}>
      <div class={styles.flow}>
        <div class={styles.brand}>
          <UKText role={"headline"} size={"m"} emphasized={true} align={"start"}>
            Set up your workspace
          </UKText>
        </div>
        <StepIndicator steps={STEPS.map((s) => s.label)} current={stepIndex()} />
        <Switch>
          <Match when={step().id === "welcome"}>
            <Welcome onVerified={verified} />
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
      </div>
    </div>
  );
};

export default Setup;
