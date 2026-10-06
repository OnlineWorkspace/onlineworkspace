import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import UKTextField from "@ewsgit/uikit-solid/src/components/textField/UKTextField.tsx";
import { type Component, For, Show } from "solid-js";
import StageHeader from "../../auth/signup/components/StageHeader/StageHeader";
import { StepButtons } from "../components/ChoiceStep/ChoiceStep";
import choiceStyles from "../components/ChoiceStep/ChoiceStep.module.scss";
import styles from "../Setup.module.scss";
import { passwordIssues } from "../state";
import type { StepProps } from "./types";

export const USERNAME_PATTERN = /^[a-z0-9_.-]{2,32}$/;

/** the administrator has no default password so this step is always a form */
export const administratorIsValid = (state: StepProps["state"]) => {
  const admin = state.administrator;

  return USERNAME_PATTERN.test(admin.username.toLowerCase()) && admin.displayName.trim() !== "" && passwordIssues(admin.password, state.access).length === 0 && admin.password === admin.confirmPassword;
};

const Administrator: Component<StepProps> = (props) => {
  const admin = () => props.state.administrator;
  const issues = () => passwordIssues(admin().password, props.state.access);

  return (
    <UKCard color={"filled"} class={choiceStyles.card}>
      <StageHeader title={"Create the administrator"} description={"This account manages the instance. It replaces the temporary account the server started with."} />
      <div class={choiceStyles.fields}>
        <UKTextField color={"outlined"} label={"Username"} supportingText={"Letters, numbers, '.', '_' and '-'"} defaultValue={admin().username} onValueChange={(v) => props.setState("administrator", "username", v.trim())} error={admin().username !== "" && !USERNAME_PATTERN.test(admin().username.toLowerCase())} autocomplete={"username"} />
        <UKTextField color={"outlined"} label={"Display name"} defaultValue={admin().displayName} onValueChange={(v) => props.setState("administrator", "displayName", v)} />
        <UKTextField color={"outlined"} label={"Email (optional)"} defaultValue={admin().email} onValueChange={(v) => props.setState("administrator", "email", v.trim())} autocomplete={"email"} />
        <UKTextField shouldMask={true} color={"outlined"} label={"Password*"} defaultValue={admin().password} onValueChange={(v) => props.setState("administrator", "password", v)} autocomplete={"new-password"} error={admin().password !== "" && issues().length > 0} />
        <Show when={admin().password !== "" && issues().length > 0}>
          <For each={issues()}>
            {(issue) => (
              <UKText role={"body"} size={"s"} align={"start"} class={styles.error}>
                {issue}
              </UKText>
            )}
          </For>
        </Show>
        <UKTextField shouldMask={true} color={"outlined"} label={"Confirm password*"} defaultValue={admin().confirmPassword} onValueChange={(v) => props.setState("administrator", "confirmPassword", v)} autocomplete={"new-password"} error={admin().confirmPassword !== "" && admin().password !== admin().confirmPassword} supportingText={"*required"} />
      </div>
      <StepButtons {...props} canContinue={administratorIsValid(props.state)} />
    </UKCard>
  );
};

export default Administrator;
