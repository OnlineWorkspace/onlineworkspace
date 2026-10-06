import CHECK_ICON from "@material-symbols/svg-700/outlined/check.svg";
import UKButton, { AffirmativeButtonState } from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKButtonGroup from "@ewsgit/uikit-solid/src/components/buttonGroup/UKButtonGroup.tsx";
import { DividerDirection } from "@ewsgit/uikit-solid/src/components/divider/lib/direction.ts";
import UKDivider from "@ewsgit/uikit-solid/src/components/divider/UKDivider.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import UKTextField from "@ewsgit/uikit-solid/src/components/textField/UKTextField.tsx";
import { type Component, createSignal, Show } from "solid-js";
import trpc from "../../../../../../lib/trpc";
import styles from "./ResetPasswordDialogue.module.scss";

const ResetPasswordDialogue: Component<{ closeDialogue: () => void; hasPassword?: boolean }> = (props) => {
  const [currentPassword, setCurrentPassword] = createSignal<string>("");
  const [passwordOne, setPasswordOne] = createSignal<string>("");
  const [passwordTwo, setPasswordTwo] = createSignal<string>("");
  const [error, setError] = createSignal<string>();

  return (
    <div class={styles.component}>
      <UKText role="title" size="l">
        Change password
      </UKText>
      <UKDivider direction={DividerDirection.horizontal} />
      <Show when={props.hasPassword}>
        <UKTextField label="Current Password" color="outlined" shouldMask onValueChange={setCurrentPassword} value={currentPassword()} defaultValue={currentPassword()} />
      </Show>
      <UKTextField label="New Password" color="outlined" shouldMask onValueChange={setPasswordOne} value={passwordOne()} defaultValue={passwordOne()} />
      <UKTextField
        label="Re-Enter New Password"
        color="outlined"
        shouldMask
        onValueChange={setPasswordTwo}
        value={passwordTwo()}
        defaultValue={passwordTwo()}
      />
      <Show when={error()}>
        <UKText role="body" size="m" align="start" class={styles.error}>
          {error()}
        </UKText>
      </Show>
      <UKText role="body" size="s" align="start">
        Changing your password signs you out of every other device.
      </UKText>
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
            setError(undefined);

            try {
              await trpc.authentication.setPassword.mutate({
                currentPassword: props.hasPassword ? currentPassword() : undefined,
                password: passwordOne(),
              });
            } catch (err) {
              setError(err instanceof Error ? err.message : "The password could not be changed");

              return { state: AffirmativeButtonState.Error };
            }

            return {
              state: AffirmativeButtonState.Success,
              cb() {
                props.closeDialogue();
              },
            };
          }}
          disabled={!(passwordOne() === passwordTwo() && passwordOne().length > 3 && (!props.hasPassword || currentPassword() !== ""))}
        >
          Confirm
        </UKButton>
      </UKButtonGroup>
    </div>
  );
};

export default ResetPasswordDialogue;
