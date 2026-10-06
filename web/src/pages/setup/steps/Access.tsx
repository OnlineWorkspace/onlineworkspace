import UKTextField from "@ewsgit/uikit-solid/src/components/textField/UKTextField.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import type { Component } from "solid-js";
import ChoiceStep from "../components/ChoiceStep/ChoiceStep";
import SettingRow from "../components/SettingRow/SettingRow";
import Summary from "../components/Summary/Summary";
import styles from "../Setup.module.scss";
import type { StepProps } from "./types";

const yesNo = (value: boolean) => (value ? "Yes" : "No");

const Access: Component<StepProps> = (props) => {
  const access = () => props.state.access;
  const number = (key: keyof ReturnType<typeof access>["passwordContains"]) => (
    <UKTextField
      color={"outlined"}
      label={key.replace("minimum", "Minimum ")}
      defaultValue={String(access().passwordContains[key])}
      onValueChange={(v) => props.setState("access", "passwordContains", key, Math.max(0, Number.parseInt(v, 10) || 0))}
    />
  );

  return (
    <ChoiceStep
      {...props}
      title={"Sign-ups and security"}
      description={"Decide who can join this instance and how strong their passwords must be."}
      canContinue={access().passwordMinimumLength >= 1}
      summary={
        <Summary
          rows={[
            ["Public sign-ups", yesNo(access().allowSignups)],
            ["Profiles on login screen", yesNo(access().displayProfilesAtLogon)],
            ["Email required", yesNo(access().requireEmail)],
            ["Two factor can be skipped", yesNo(!access().requireTwoFactor)],
            ["Password length", `${access().passwordMinimumLength} or more characters`],
            ["Password contents", "Upper and lowercase letters, a number and a symbol"],
          ]}
        />
      }
    >
      <SettingRow label={"Allow sign-ups"} supporting={"Let anyone create an account from the login page"} value={access().allowSignups} onValueChange={(v) => props.setState("access", "allowSignups", v)} />
      <SettingRow label={"Show profiles on login"} supporting={"Lists users on the login screen, only use on instances which are not public"} value={access().displayProfilesAtLogon} onValueChange={(v) => props.setState("access", "displayProfilesAtLogon", v)} />
      <SettingRow
        label={"Require email"}
        supporting={props.state.mailServer.enabled ? "New users must verify an email address" : "Set up a mail server in the Email step to use this"}
        value={access().requireEmail}
        disabled={!props.state.mailServer.enabled}
        onValueChange={(v) => props.setState("access", "requireEmail", v)}
      />
      <SettingRow label={"Don't allow skipping two factor"} supporting={"Hides the skip button when new users set up two factor during sign-up. This isn't enforced on the server."} value={access().requireTwoFactor} onValueChange={(v) => props.setState("access", "requireTwoFactor", v)} />
      <UKText role={"title"} size={"s"} align={"start"} class={styles.subtle}>
        Password policy
      </UKText>
      <UKTextField color={"outlined"} label={"Minimum length"} defaultValue={String(access().passwordMinimumLength)} onValueChange={(v) => props.setState("access", "passwordMinimumLength", Math.min(128, Math.max(0, Number.parseInt(v, 10) || 0)))} error={access().passwordMinimumLength < 1} />
      {number("minimumUppercase")}
      {number("minimumLowercase")}
      {number("minimumNumbers")}
      {number("minimumSymbols")}
    </ChoiceStep>
  );
};

export default Access;
