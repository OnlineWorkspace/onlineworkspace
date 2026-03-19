import UKButton from "@tcsw/uikit-solid/src/components/button/UKButton.jsx";
import UKButtonGroup from "@tcsw/uikit-solid/src/components/buttonGroup/UKButtonGroup.jsx";
import UKDialog from "@tcsw/uikit-solid/src/components/dialog/UKDialog.jsx";
import UKDivider from "@tcsw/uikit-solid/src/components/divider/UKDivider.jsx";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.jsx";
import UKTextField from "@tcsw/uikit-solid/src/components/textField/UKTextField.jsx";
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
        <UKTextField
          color={"outlined"}
          label={"Username"}
          getValue={setUsername}
          setValue={username()}
          defaultValue={username()}
        />
        <UKTextField
          color={"outlined"}
          label={"Password"}
          shouldMask
          getValue={setPassword}
          setValue={password()}
          defaultValue={password()}
        />
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
