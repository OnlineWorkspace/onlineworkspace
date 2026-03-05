import { DividerDirection } from "@tcsw/uikit-solid/src/components/divider/lib/direction.js";
import UKDivider from "@tcsw/uikit-solid/src/components/divider/UKDivider.jsx";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.jsx";
import UKTextField from "@tcsw/uikit-solid/src/components/textField/UKTextField.jsx";
import { createSignal, type Component } from "solid-js";
import styles from "./ResetPasswordDialogue.module.scss";
import UKButton from "@tcsw/uikit-solid/src/components/button/UKButton.jsx";
import trpc from "../../../../../../lib/trpc";

const ResetPasswordDialogue: Component<{ closeDialogue: () => void }> = (props) => {
    const [passwordOne, setPasswordOne] = createSignal<string>("");
    const [passwordTwo, setPasswordTwo] = createSignal<string>("");

    return (
      <div class={styles.component}>
        <UKText role="title" size="l">
          Change password
        </UKText>
        <UKDivider direction={DividerDirection.horizontal} />
        <UKTextField
          label="New Password"
          color="outlined"
          shouldMask
          getValue={setPasswordOne}
          defaultValue={passwordOne()}
        />
        <UKTextField
          label="Re-Enter New Password"
          color="outlined"
          shouldMask
          getValue={setPasswordTwo}
          defaultValue={passwordTwo()}
        />
        <UKButton
          leadingIcon="check"
          color="filled"
          class={styles.confirmButton}
          onClick={async () => {
            if (passwordOne() === passwordTwo())
              await trpc.authentication.setPassword.mutate({
                password: passwordOne(),
              });

            props.closeDialogue();
          }}
          disabled={
            !(passwordOne() === passwordTwo() && passwordOne().length > 3)
          }
        >
          Confirm
        </UKButton>
      </div>
    );
};

export default ResetPasswordDialogue;
