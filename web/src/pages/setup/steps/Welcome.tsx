import UKButton, { AffirmativeButtonState } from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import UKTextField from "@ewsgit/uikit-solid/src/components/textField/UKTextField.tsx";
import { type Component, createSignal } from "solid-js";
import StageHeader from "../../auth/signup/components/StageHeader/StageHeader";
import { FieldError } from "../components/ChoiceStep/ChoiceStep";
import choiceStyles from "../components/ChoiceStep/ChoiceStep.module.scss";
import styles from "../Setup.module.scss";

/** the first step, proves whoever is setting the instance up can see its console */
const Welcome: Component<{ onVerified(token: string): Promise<void> }> = (props) => {
  const [token, setToken] = createSignal("");
  const [error, setError] = createSignal<string>();

  return (
    <UKCard color={"filled"} class={choiceStyles.card}>
      <StageHeader title={"Welcome"} description={"Let's set up your new workspace. It only takes a few minutes, and everything can be changed later in settings."} />
      <UKText role={"body"} size={"m"} align={"start"} class={styles.subtle}>
        To make sure you are the owner of this instance, enter the setup token printed in the server's console.
      </UKText>
      <UKTextField color={"outlined"} label={"Setup token"} defaultValue={token()} onValueChange={(v) => setToken(v.trim())} autocomplete={"off"} error={error() !== undefined} />
      <FieldError message={error()} />
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
    </UKCard>
  );
};

export default Welcome;
