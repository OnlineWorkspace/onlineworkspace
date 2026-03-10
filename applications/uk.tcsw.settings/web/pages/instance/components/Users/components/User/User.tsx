import UKStackItem from "@tcsw/uikit-solid/src/components/stack/UKStackItem.jsx";
import { createResource, createSignal, type Component } from "solid-js";
import styles from "./User.module.scss";
import UKTextField from "@tcsw/uikit-solid/src/components/textField/UKTextField.jsx";
import UKSwitch from "@tcsw/uikit-solid/src/components/switch/UKSwitch.jsx";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.jsx";
import UKButton from "@tcsw/uikit-solid/src/components/button/UKButton.jsx";
import trpc from "../../../../../../lib/trpc";
import UKButtonGroup from "@tcsw/uikit-solid/src/components/buttonGroup/UKButtonGroup.jsx";
import UKDialog from "@tcsw/uikit-solid/src/components/dialog/UKDialog.jsx";
import UKDivider from "@tcsw/uikit-solid/src/components/divider/UKDivider.jsx";

const User: Component<{
  userId: number;
  updateUsers: () => void;
}> = (props) => {
  const [showDialog, setShowDialog] = createSignal(false);
  const [username, { mutate: setUsername }] = createResource(
    () => trpc.instance.user.getUsername.query(props.userId),
    {
      initialValue: "",
    },
  );
  const [email, { mutate: setEmail }] = createResource(
    () => trpc.instance.user.getEmail.query(props.userId),
    {
      initialValue: "",
    },
  );
  const [forename, { mutate: setForename }] = createResource(
    () => trpc.instance.user.getForename.query(props.userId),
    {
      initialValue: "",
    },
  );
  const [surname, { mutate: setSurname }] = createResource(
    () => trpc.instance.user.getSurname.query(props.userId),
    {
      initialValue: "",
    },
  );
  const [isAdministrator, { mutate: setIsAdministrator }] = createResource(
    () => trpc.instance.user.getIsAdministrator.query(props.userId),
    { initialValue: false },
  );

  return (
    <>
      <UKStackItem
        leading={{
          type: "icon",
          value: isAdministrator() ? "shield_person" : "person",
        }}
        labelText={`${forename()} ${surname()}`}
        supportingText={`(${props.userId}) ${username()}`}
        onClick={() => setShowDialog(true)}
      />
      <UKDialog show={showDialog} onClose={() => setShowDialog(false)}>
        <div class={styles.expanded}>
          <UKText role="title" size="l">
            Modify User
          </UKText>
          <UKDivider direction="horizontal" />
          <UKTextField
            color="outlined"
            getValue={(val) => {
              setUsername(val);
              trpc.instance.user.setUsername.mutate({
                userId: props.userId,
                username: val,
              });
            }}
            defaultValue={username()}
            label="Username"
          />
          <div class={styles.name}>
            <UKTextField
              color="outlined"
              getValue={(val) => {
                setForename(val);
                trpc.instance.user.setForename.mutate({
                  userId: props.userId,
                  forename: val,
                });
              }}
              defaultValue={forename()}
              label="Forename"
            />
            <UKTextField
              color="outlined"
              getValue={(val) => {
                setSurname(val);
                trpc.instance.user.setSurname.mutate({
                  userId: props.userId,
                  surname: val,
                });
              }}
              defaultValue={surname()}
              label="Surname"
            />
          </div>
          <UKTextField
            color="outlined"
            getValue={(val) => {
              setEmail(val);
              trpc.instance.user.setEmail.mutate({
                userId: props.userId,
                email: val,
              });
            }}
            defaultValue={email()}
            label="Email"
          />
          <div class={styles.boolean}>
            <UKText role="label" size="m">
              Is Administrator
            </UKText>
            <UKSwitch
              getValue={(val) => {
                setIsAdministrator(val);
                trpc.instance.user.setIsAdministrator.mutate({
                  administrator: val,
                  userId: props.userId,
                });
              }}
              value={isAdministrator()}
            />
          </div>
          <UKButtonGroup size={"s"} align={"start"}>
            <UKButton color={"tonal"} disabled={true} onClick={() => 0}>
              Invalidate all sessions
            </UKButton>
            <UKButton color={"tonal"} disabled={true} onClick={() => 0}>
              Force password reset
            </UKButton>
            <UKButton
              color={"standard"}
              onClick={() => {
                // send a boop notification
                trpc.instance.user.boop.mutate({ userId: props.userId });
              }}
            >
              Boop
            </UKButton>
            {/* FIXME: TODO: add warning dialog */}
            <UKButton
              color={"standard"}
              onClick={async () => {
                await trpc.instance.user.delete.mutate({
                  userId: props.userId,
                });
                props.updateUsers();
              }}
            >
              Delete
            </UKButton>
          </UKButtonGroup>
          <UKButton
            class={styles.closeButton}
            color={"filled"}
            onClick={() => {
              setShowDialog(false);
            }}
          >
            Close
          </UKButton>
        </div>
      </UKDialog>
    </>
  );
};

export default User;
