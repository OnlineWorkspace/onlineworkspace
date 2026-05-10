import CHECK_ICON from "@material-symbols/svg-700/outlined/check.svg";
import UKButton, { AffirmativeButtonState } from "@ewsgit/uikit-solid/src/components/button/UKButton.jsx";
import UKButtonGroup from "@ewsgit/uikit-solid/src/components/buttonGroup/UKButtonGroup.tsx";
import { DividerDirection } from "@ewsgit/uikit-solid/src/components/divider/lib/direction.js";
import UKDivider from "@ewsgit/uikit-solid/src/components/divider/UKDivider.jsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.jsx";
import UKTextField from "@ewsgit/uikit-solid/src/components/textField/UKTextField.jsx";
import { type Component, createSignal } from "solid-js";
import trpc from "../../../../../../lib/trpc";
import styles from "./ResetPasswordDialogue.module.scss";

const ResetPasswordDialogue: Component<{ closeDialogue: () => void }> = (props) => {
  const [passwordOne, setPasswordOne] = createSignal<string>("");
  const [passwordTwo, setPasswordTwo] = createSignal<string>("");

  return (
    <div class={styles.component}>
      <UKText role="title" size="l">
        Change password
      </UKText>
      <UKDivider direction={DividerDirection.horizontal} />
      <UKTextField label="New Password" color="outlined" shouldMask onValueChange={setPasswordOne} value={passwordOne()} defaultValue={passwordOne()} />
      <UKTextField
        label="Re-Enter New Password"
        color="outlined"
        shouldMask
        onValueChange={setPasswordTwo}
        value={passwordTwo()}
        defaultValue={passwordTwo()}
      />
      <UKButtonGroup size={"s"}>
        <UKButton
          color="tonal"
          onClick={() => {
            props.closeDialogue();
          }}
        >
          Cancel
        </UKButton>
        <UKButton
          leadingIcon={CHECK_ICON}
          color="filled"
          affirmative={true}
          class={styles.confirmButton}
          onClick={async () => {
            if (passwordOne() === passwordTwo())
              await trpc.authentication.setPassword.mutate({
                password: passwordOne(),
              });

            return {
              state: AffirmativeButtonState.Success,
              cb() {
                props.closeDialogue();
              },
            };
          }}
          disabled={!(passwordOne() === passwordTwo() && passwordOne().length > 3)}
        >
          Confirm
        </UKButton>
      </UKButtonGroup>
    </div>
  );
};

export default ResetPasswordDialogue;
