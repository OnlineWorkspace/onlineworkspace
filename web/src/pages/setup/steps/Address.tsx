import UKTextField from "@ewsgit/uikit-solid/src/components/textField/UKTextField.tsx";
import type { Component } from "solid-js";
import ChoiceStep from "../components/ChoiceStep/ChoiceStep";
import SettingRow from "../components/SettingRow/SettingRow";
import Summary from "../components/Summary/Summary";
import type { StepProps } from "./types";

const Address: Component<StepProps> = (props) => (
  <ChoiceStep
    {...props}
    title={"Address"}
    recommendedLabel={"Detected"}
    description={"The address people use to reach this instance. It is used for sign-in cookies, links in emails and two factor codes, so make sure it is right."}
    canContinue={props.state.address.hostname.trim() !== ""}
    summary={<Summary rows={[["Hostname", props.state.address.hostname], ["Connection", props.state.address.secure ? "Secure (HTTPS)" : "Not secure (HTTP)"]]} />}
  >
    <UKTextField color={"outlined"} label={"Hostname"} supportingText={"For example workspace.example.com, without https:// or a port"} defaultValue={props.state.address.hostname} onValueChange={(v) => props.setState("address", "hostname", v.trim())} error={props.state.address.hostname.trim() === ""} />
    <SettingRow label={"Use HTTPS"} supporting={"Turn this off only for local testing"} value={props.state.address.secure} onValueChange={(v) => props.setState("address", "secure", v)} />
  </ChoiceStep>
);

export default Address;
