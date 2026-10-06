import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import { type Component, For } from "solid-js";
import ChoiceStep from "../components/ChoiceStep/ChoiceStep";
import SettingRow from "../components/SettingRow/SettingRow";
import Summary from "../components/Summary/Summary";
import type { StepProps } from "./types";

const Applications: Component<StepProps> = (props) => {
  const installed = () => props.defaults.applications.installed;
  const isEnabled = (id: string) => props.state.applications.enabled.includes(id);
  const nameOf = (id: string) => installed().find((a) => a.id === id)?.displayName ?? id;

  const toggle = (id: string, enabled: boolean) => {
    props.setState("applications", "enabled", (list) => (enabled ? [...list, id] : list.filter((a) => a !== id)));
    // a disabled application can't be a shortcut
    if (!enabled) props.setState("applications", "quickShortcuts", (list) => list.filter((a) => a !== id));
  };

  return (
    <ChoiceStep
      {...props}
      title={"Applications"}
      description={"Choose which applications are available. Others can be added from the store at any time."}
      summary={
        <Summary
          rows={[
            ["Enabled", props.state.applications.enabled.map(nameOf).join(", ")],
            ["Quick shortcuts", props.state.applications.quickShortcuts.map(nameOf).join(", ") || "None"],
          ]}
        />
      }
    >
      <For each={installed()}>
        {(app) => (
          <SettingRow
            label={app.displayName}
            supporting={app.required ? `${app.description} (Required)` : app.description}
            value={isEnabled(app.id)}
            disabled={app.required}
            onValueChange={(v) => toggle(app.id, v)}
          />
        )}
      </For>
      <UKText role={"body"} size={"s"} align={"start"}>
        Quick shortcuts can be changed by each user in their settings.
      </UKText>
    </ChoiceStep>
  );
};

export default Applications;
