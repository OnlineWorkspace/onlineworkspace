import KEY_ICON from "@material-symbols/svg-700/outlined/key.svg";
import SCHEDULE_ICON from "@material-symbols/svg-700/outlined/schedule.svg";
import TUNE_ICON from "@material-symbols/svg-700/outlined/tune.svg";
import UKButton, { AffirmativeButtonState } from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKIcon from "@ewsgit/uikit-solid/src/components/icon/UKIcon.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import UKTextField from "@ewsgit/uikit-solid/src/components/textField/UKTextField.tsx";
import { type Component, createSignal, For } from "solid-js";
import { FieldError } from "../components/ChoiceStep/ChoiceStep";
import styles from "../Setup.module.scss";

const HIGHLIGHTS = [
  { icon: SCHEDULE_ICON, title: "A few minutes", description: "Sensible defaults are chosen for you at every step." },
  { icon: TUNE_ICON, title: "Make it yours", description: "Name, login page, security, users and applications." },
  { icon: KEY_ICON, title: "Change it later", description: "Everything here can be edited afterwards in settings." },
];

/** the first step, proves whoever is setting the instance up can see its console */
const Welcome: Component<{ onVerified(token: string): Promise<void> }> = (props) => {
  const [token, setToken] = createSignal("");
  const [error, setError] = createSignal<string>();

  const verify = async () => {
    setError(undefined);

    try {
      await props.onVerified(token());
      return { state: AffirmativeButtonState.Success };
    } catch (err) {
      setError(err instanceof Error ? err.message : "The setup token could not be verified");
      return { state: AffirmativeButtonState.Error };
    }
  };

  return (
    <section class={styles.welcome}>
      <div class={styles.welcomeInner}>
        <img class={styles.welcomeLogo} src={"/assets/onlineworkspace/online_workspace_logo.svg"} alt={"OnlineWorkspace"} />
        <div class={styles.welcomeHeading}>
          <UKText role={"display"} size={"m"} emphasized={true} align={"center"}>
            Welcome to OnlineWorkspace
          </UKText>
          <UKText role={"body"} size={"l"} align={"center"} class={styles.subtle}>
            Let's set up your new workspace.
          </UKText>
        </div>
        <div class={styles.highlights}>
          <For each={HIGHLIGHTS}>
            {(item) => (
              <div class={styles.highlight}>
                <UKIcon>{item.icon}</UKIcon>
                <UKText role={"title"} size={"m"} emphasized={true} align={"start"}>
                  {item.title}
                </UKText>
                <UKText role={"body"} size={"m"} align={"start"} class={styles.subtle}>
                  {item.description}
                </UKText>
              </div>
            )}
          </For>
        </div>
        <div class={styles.tokenCard}>
          <UKText role={"title"} size={"m"} emphasized={true} align={"start"}>
            Verify you own this instance
          </UKText>
          <UKText role={"body"} size={"m"} align={"start"} class={styles.subtle}>
            Enter the setup token printed in the server's console.
          </UKText>
          <UKTextField color={"outlined"} label={"Setup token"} defaultValue={token()} onValueChange={(v) => setToken(v.trim())} onSubmit={verify} autocomplete={"off"} error={error() !== undefined} />
          <FieldError message={error()} />
          <UKButton affirmative={true} color={"filled"} disabled={token() === ""} onClick={verify}>
            Get started
          </UKButton>
        </div>
      </div>
    </section>
  );
};

export default Welcome;
