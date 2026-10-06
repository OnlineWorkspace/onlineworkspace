import UKButton, { AffirmativeButtonState } from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import UKTextField from "@ewsgit/uikit-solid/src/components/textField/UKTextField.tsx";
import { type Component, createSignal } from "solid-js";
import { FieldError } from "../components/ChoiceStep/ChoiceStep";
import StepPage from "../components/StepPage/StepPage";
import styles from "../Setup.module.scss";

/** the first step, proves whoever is setting the instance up can see its console */
const Welcome: Component<{ onVerified(token: string): Promise<void> }> = (props) => {
  const [token, setToken] = createSignal("");
  const [error, setError] = createSignal<string>();

  return (
    <StepPage
      title={"Welcome"}
      description={"Let's set up your new workspace. It only takes a few minutes, and everything can be changed later in settings."}
      actions={
        <>
          <span />
          <UKButton
            affirmative={true}
            color={"filled"}
            disabled={token() === ""}
            onClick={async () => {
              setError(undefined);

              try {
                await props.onVerified(token());
                return { state: AffirmativeButtonState.Success };
              } catch (err) {
                setError(err instanceof Error ? err.message : "The setup token could not be verified");
                return { state: AffirmativeButtonState.Error };
              }
            }}
          >
            Get started
          </UKButton>
        </>
      }
    >
      <div class={styles.tokenField}>
        <UKText role={"body"} size={"l"} align={"start"} class={styles.subtle}>
          To make sure you are the owner of this instance, enter the setup token printed in the server's console.
        </UKText>
        <UKTextField color={"outlined"} label={"Setup token"} defaultValue={token()} onValueChange={(v) => setToken(v.trim())} autocomplete={"off"} error={error() !== undefined} />
        <FieldError message={error()} />
      </div>
    </StepPage>
  );
};

export default Welcome;
