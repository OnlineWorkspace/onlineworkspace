import PERSON_ADD_ICON from "@material-symbols/svg-700/outlined/person_add.svg";
import UKButton, { AffirmativeButtonState } from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKButtonGroup from "@ewsgit/uikit-solid/src/components/buttonGroup/UKButtonGroup.tsx";
import UKDialog from "@ewsgit/uikit-solid/src/components/dialog/UKDialog.tsx";
import UKIcon from "@ewsgit/uikit-solid/src/components/icon/UKIcon.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import UKTextField from "@ewsgit/uikit-solid/src/components/textField/UKTextField.tsx";
import { type Component, createSignal, Show } from "solid-js";
import trpc from "../../../../../lib/trpc";
import styles from "./CreateUser.module.scss";

const CreateUser: Component<{ updateUsers: () => void }> = (props) => {
  const [username, setUsername] = createSignal<string>("");
  const [password, setPassword] = createSignal<string>("");
  const [error, setError] = createSignal<string>();
  const [showCreateUserDialog, setShowCreateUserDialog] = createSignal<boolean>(false);

  const close = () => {
    setShowCreateUserDialog(false);
    setUsername("");
    setPassword("");
    setError(undefined);
  };

  return (
    <>
      <div class={styles.component}>
        <UKButton class={styles.createNewUserButton} onClick={() => {
            setShowCreateUserDialog(true);
          }} size={"s"} color="filled" leadingIcon={PERSON_ADD_ICON}>
          Create user
        </UKButton>
      </div>
      <UKDialog show={showCreateUserDialog} onClose={close} maxWidth="28rem">
        <div class={styles.expanded}>
          <div class={styles.header}>
            <span class={styles.headerIcon}>
              <UKIcon>{PERSON_ADD_ICON}</UKIcon>
            </span>
            <div class={styles.headerText}>
              <UKText role="title" size="l" align="start">
                Create user
              </UKText>
              <UKText role="body" size="m" align="start" class={styles.hint}>
                They can change their name, email and password themselves after they sign in.
              </UKText>
            </div>
          </div>
          <div class={styles.field}>
            <UKTextField color={"outlined"} label={"Username"} onValueChange={setUsername} value={username()} defaultValue={username()} />
            <UKText role="body" size="s" class={styles.hint}>
              Usernames are saved in lowercase.
            </UKText>
          </div>
          <div class={styles.field}>
            <UKTextField color={"outlined"} label={"Temporary password"} shouldMask onValueChange={setPassword} value={password()} defaultValue={password()} />
            <UKText role="body" size="s" class={styles.hint}>
              Share this with them securely.
            </UKText>
          </div>
          <Show when={error()}>
            <UKText role="body" size="m" class={styles.error}>
              {error()}
            </UKText>
          </Show>
          <UKButtonGroup size={"s"} align="end">
            <UKButton color="tonal" onClick={close}>
              Cancel
            </UKButton>
            <UKButton
              affirmative
              disabled={username().trim().length === 0 || password().length === 0}
              onClick={async () => {
                setError(undefined);

                try {
                  await trpc.instance.createUser.mutate({
                    username: username().trim(),
                    password: password(),
                  });
                } catch (err) {
                  setError(err instanceof Error ? err.message : "The user could not be created");

                  return { state: AffirmativeButtonState.Error };
                }

                props.updateUsers();

                return {
                  state: AffirmativeButtonState.Success,
                  cb() {
                    close();
                  },
                };
              }}
            >
              Create user
            </UKButton>
          </UKButtonGroup>
        </div>
      </UKDialog>
    </>
  );
};

export default CreateUser;
