import UKTextField from "@ewsgit/uikit-solid/src/components/textField/UKTextField.tsx";
import { type Component, createSignal } from "solid-js";
import ChoiceStep from "../components/ChoiceStep/ChoiceStep";
import Summary from "../components/Summary/Summary";
import { formatBytes, GIGABYTE } from "../state";
import type { StepProps } from "./types";

const NewUsers: Component<StepProps> = (props) => {
  const users = () => props.state.newUsers;
  // the raw text is kept so a trailing comma can be typed
  const [folders, setFolders] = createSignal(users().homeDirectories.join(", "));
  const [quota, setQuota] = createSignal(String(users().quotaSize / GIGABYTE));

  return (
    <ChoiceStep
      {...props}
      title={"New users"}
      description={"What every new account starts with."}
      canContinue={users().quotaSize > 0 && users().displayNameFormat.trim() !== ""}
      onCustomChange={(custom) => {
        props.onCustomChange(custom);
        // restoring the recommended values must be reflected the next time the fields are shown
        setFolders(users().homeDirectories.join(", "));
        setQuota(String(users().quotaSize / GIGABYTE));
      }}
      summary={
        <Summary
          rows={[
            ["Storage quota", formatBytes(users().quotaSize)],
            ["Home folders", users().homeDirectories.join(", ") || "None"],
            ["Default display name", users().displayNameFormat],
          ]}
        />
      }
    >
      <UKTextField
        color={"outlined"}
        label={"Storage quota (GB)"}
        defaultValue={quota()}
        onValueChange={(v) => {
          setQuota(v);
          const gigabytes = Number(v);
          props.setState("newUsers", "quotaSize", Number.isFinite(gigabytes) && gigabytes > 0 ? Math.round(gigabytes * GIGABYTE) : 0);
        }}
        error={users().quotaSize <= 0}
      />
      <UKTextField
        color={"outlined"}
        label={"Home folders"}
        supportingText={"Comma separated, created in every new user's storage"}
        defaultValue={folders()}
        onValueChange={(v) => {
          setFolders(v);
          props.setState(
            "newUsers",
            "homeDirectories",
            v
              .split(",")
              .map((f) => f.trim())
              .filter((f) => f !== "" && !/[/\\]/.test(f)),
          );
        }}
      />
      <UKTextField color={"outlined"} label={"Default display name"} supportingText={"%num% is replaced with a unique number"} defaultValue={users().displayNameFormat} onValueChange={(v) => props.setState("newUsers", "displayNameFormat", v)} error={users().displayNameFormat.trim() === ""} />
    </ChoiceStep>
  );
};

export default NewUsers;
