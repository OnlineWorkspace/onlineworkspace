import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import UKTextField from "@ewsgit/uikit-solid/src/components/textField/UKTextField.tsx";
import { type Component, createSignal, Show } from "solid-js";
import trpc from "../../../lib/trpc";
import ChoiceStep from "../components/ChoiceStep/ChoiceStep";
import SettingRow from "../components/SettingRow/SettingRow";
import Summary from "../components/Summary/Summary";
import styles from "../Setup.module.scss";
import type { StepProps } from "./types";

const Mail: Component<StepProps> = (props) => {
  const mail = () => props.state.mailServer;
  const [testResult, setTestResult] = createSignal<{ ok: boolean; message: string } | undefined>();
  const [testing, setTesting] = createSignal(false);

  const test = async () => {
    setTesting(true);
    setTestResult(undefined);

    try {
      const { error } = await trpc.setup.testMailServer.mutate({
        token: props.token,
        mailServer: { enabled: true, host: mail().host, port: mail().port, secure: mail().secure, auth: { user: mail().auth.user, pass: mail().auth.pass } },
      });
      setTestResult(error ? { ok: false, message: error } : { ok: true, message: "Connected to the mail server" });
    } catch (err) {
      setTestResult({ ok: false, message: err instanceof Error ? err.message : "The test failed" });
    } finally {
      setTesting(false);
    }
  };

  return (
    <ChoiceStep
      {...props}
      title={"Email"}
      recommendedLabel={"Skip for now"}
      description={"A mail server lets the instance send verification codes and password resets. You can set this up later in settings."}
      onCustomChange={(custom) => {
        // choosing to customise means the server is wanted
        props.onCustomChange(custom);
        if (custom) props.setState("mailServer", "enabled", true);
      }}
      canContinue={!mail().enabled || (mail().host.trim() !== "" && mail().port > 0)}
      summary={<Summary rows={[["Mail server", "Not configured"], ["Email verification", "Unavailable until a mail server is set up"]]} />}
    >
      <SettingRow label={"Enable mail server"} value={mail().enabled} onValueChange={(v) => props.setState("mailServer", "enabled", v)} />
      <Show when={mail().enabled}>
        <UKTextField color={"outlined"} label={"SMTP host"} supportingText={"For example smtp.example.com"} defaultValue={mail().host} onValueChange={(v) => props.setState("mailServer", "host", v.trim())} error={mail().host.trim() === ""} />
        <UKTextField color={"outlined"} label={"Port"} defaultValue={String(mail().port)} onValueChange={(v) => props.setState("mailServer", "port", Number.parseInt(v, 10) || 0)} error={mail().port <= 0 || mail().port > 65535} />
        <SettingRow label={"Secure connection"} supporting={"Use TLS, this is normally on for port 465"} value={mail().secure} onValueChange={(v) => props.setState("mailServer", "secure", v)} />
        <UKTextField color={"outlined"} label={"Username"} defaultValue={mail().auth.user} onValueChange={(v) => props.setState("mailServer", "auth", "user", v)} autocomplete={"off"} />
        <UKTextField shouldMask={true} color={"outlined"} label={"Password"} defaultValue={mail().auth.pass} onValueChange={(v) => props.setState("mailServer", "auth", "pass", v)} autocomplete={"off"} />
        <UKButton color={"outlined"} disabled={testing() || mail().host.trim() === ""} onClick={test}>
          {testing() ? "Testing..." : "Test connection"}
        </UKButton>
        <Show when={testResult()}>
          <UKText role={"body"} size={"m"} align={"start"} class={testResult()?.ok ? styles.subtle : styles.error}>
            {testResult()?.message}
          </UKText>
        </Show>
      </Show>
    </ChoiceStep>
  );
};

export default Mail;
