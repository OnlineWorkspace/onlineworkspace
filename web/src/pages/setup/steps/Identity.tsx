import UKTextField from "@ewsgit/uikit-solid/src/components/textField/UKTextField.tsx";
import type { Component } from "solid-js";
import ChoiceStep from "../components/ChoiceStep/ChoiceStep";
import SettingRow from "../components/SettingRow/SettingRow";
import Summary from "../components/Summary/Summary";
import type { StepProps } from "./types";

const Identity: Component<StepProps> = (props) => (
  <ChoiceStep
    {...props}
    title={"Name your workspace"}
    description={"This is how your instance introduces itself on the login screen and in browser tabs."}
    canContinue={props.state.identity.displayName.trim() !== ""}
    summary={
      <Summary
        rows={[
          ["Name", props.state.identity.displayName],
          ["Tagline", props.state.identity.tagline || "None"],
          ["Login background", props.state.identity.showLoginBackground ? "Shown" : "Hidden"],
          ["Login banner", props.state.identity.showLoginBanner ? "Shown" : "Hidden"],
        ]}
      />
    }
  >
    <UKTextField color={"outlined"} label={"Instance name"} defaultValue={props.state.identity.displayName} onValueChange={(v) => props.setState("identity", "displayName", v)} error={props.state.identity.displayName.trim() === ""} />
    <UKTextField color={"outlined"} label={"Tagline"} defaultValue={props.state.identity.tagline} onValueChange={(v) => props.setState("identity", "tagline", v)} />
    <UKTextField color={"outlined"} as={"textarea"} label={"Description"} supportingText={"Used as the page description for search engines"} defaultValue={props.state.identity.metaDescription} onValueChange={(v) => props.setState("identity", "metaDescription", v)} />
    <SettingRow label={"Login background"} supporting={"Show the background image behind the login screen"} value={props.state.identity.showLoginBackground} onValueChange={(v) => props.setState("identity", "showLoginBackground", v)} />
    <SettingRow label={"Login banner"} supporting={"Show the banner image on the login screen"} value={props.state.identity.showLoginBanner} onValueChange={(v) => props.setState("identity", "showLoginBanner", v)} />
  </ChoiceStep>
);

export default Identity;
