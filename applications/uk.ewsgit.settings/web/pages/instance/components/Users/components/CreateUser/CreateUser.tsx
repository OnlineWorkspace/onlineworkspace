import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKButtonGroup from "@ewsgit/uikit-solid/src/components/buttonGroup/UKButtonGroup.tsx";
import UKDialog from "@ewsgit/uikit-solid/src/components/dialog/UKDialog.tsx";
import UKDivider from "@ewsgit/uikit-solid/src/components/divider/UKDivider.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import UKTextField from "@ewsgit/uikit-solid/src/components/textField/UKTextField.tsx";
import { type Component, createSignal } from "solid-js";
import trpc from "../../../../../../lib/trpc";
import styles from "./CreateUser.module.scss";

const CreateUser: Component<{ updateUsers: () => void }> = (props) => {
  const [username, setUsername] = createSignal<string>("");
  const [password, setPassword] = createSignal<string>("");
  const [showCreateUserDialog, setShowCreateUserDialog] = createSignal<boolean>(false);

  return (
    <>
      <div class={styles.component}>
        <UKButton
          class={styles.createNewUserButton}
          onClick={() => {
            setShowCreateUserDialog(true);
          }}
          size={"s"}
          color="filled"
        >
          Create new user
        </UKButton>
      </div>
      <UKDialog
        show={showCreateUserDialog}
        onClose={() => {
          setShowCreateUserDialog(false);
          setUsername("");
          setPassword("");
        }}
      >
        <UKText role="title" size="l">
          Create user
        </UKText>
        <UKDivider direction="horizontal" />
        <UKTextField color={"outlined"} label={"Username"} onValueChange={setUsername} value={username()} defaultValue={username()} />
        <UKTextField color={"outlined"} label={"Password"} shouldMask onValueChange={setPassword} value={password()} defaultValue={password()} />
        <UKButtonGroup size={"s"} align="end">
          <UKButton
            color="tonal"
            onClick={() => {
              setShowCreateUserDialog(false);
              setUsername("");
              setPassword("");
            }}
          >
            Cancel
          </UKButton>
          <UKButton
            affirmative
            disabled={username().length === 0}
            onClick={async () => {
              await trpc.instance.createUser.mutate({
                username: username(),
                password: password(),
              });
              props.updateUsers();
              setUsername("");
              setPassword("");
              return () => {
                setShowCreateUserDialog(false);
              };
            }}
          >
            Create User
          </UKButton>
        </UKButtonGroup>
      </UKDialog>
    </>
  );
};

export default CreateUser;
