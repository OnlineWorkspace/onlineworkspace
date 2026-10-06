import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import UKTextField from "@ewsgit/uikit-solid/src/components/textField/UKTextField.tsx";
import type { Component } from "solid-js";
import ChoiceStep from "../components/ChoiceStep/ChoiceStep";
import styles from "../Setup.module.scss";
import type { StepProps } from "./types";

const Terms: Component<StepProps> = (props) => (
  <ChoiceStep
    {...props}
    title={"Terms of use"}
    recommendedLabel={"Standard terms"}
    description={"Every new user must accept these before creating an account."}
    canContinue={props.state.termsOfUse.trim() !== ""}
    summary={
      <UKText retainTextFormatting role={"body"} size={"s"} align={"start"} class={styles.terms}>
        {props.state.termsOfUse}
      </UKText>
    }
  >
    <UKTextField color={"outlined"} as={"textarea"} label={"Terms of use"} defaultValue={props.state.termsOfUse} onValueChange={(v) => props.setState("termsOfUse", v)} error={props.state.termsOfUse.trim() === ""} />
  </ChoiceStep>
);

export default Terms;
