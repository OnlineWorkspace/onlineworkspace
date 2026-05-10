import PERSON_ICON from "@material-symbols/svg-700/outlined/person.svg";
import SHIELD_PERSON_ICON from "@material-symbols/svg-700/outlined/shield_person.svg";
import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.jsx";
import UKButtonGroup from "@ewsgit/uikit-solid/src/components/buttonGroup/UKButtonGroup.jsx";
import UKDialog from "@ewsgit/uikit-solid/src/components/dialog/UKDialog.jsx";
import UKDivider from "@ewsgit/uikit-solid/src/components/divider/UKDivider.jsx";
import UKStackItem from "@ewsgit/uikit-solid/src/components/stack/UKStackItem.jsx";
import UKSwitch from "@ewsgit/uikit-solid/src/components/switch/UKSwitch.jsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.jsx";
import UKTextField from "@ewsgit/uikit-solid/src/components/textField/UKTextField.jsx";
import { type Component, createResource, createSignal, Show, useContext } from "solid-js";
import { AppContext } from "../../../../../../appContext.ts";
import trpc from "../../../../../../lib/trpc";
import styles from "./User.module.scss";

const User: Component<{
  userId: number;
  updateUsers: () => void;
}> = (props) => {
  const appContext = useContext(AppContext)!;
  const [showDialog, setShowDialog] = createSignal<"user" | "confirmDelete" | "removeOwnAdmin" | undefined>(undefined);
  const [username, { mutate: setUsername }] = createResource(() => trpc.instance.user.getUsername.query(props.userId), {
    initialValue: "",
  });
  const [email, { mutate: setEmail }] = createResource(() => trpc.instance.user.getEmail.query(props.userId), {
    initialValue: "",
  });
  const [forename, { mutate: setForename }] = createResource(() => trpc.instance.user.getForename.query(props.userId), {
    initialValue: "",
  });
  const [surname, { mutate: setSurname }] = createResource(() => trpc.instance.user.getSurname.query(props.userId), {
    initialValue: "",
  });
  const [isAdministrator, { mutate: setIsAdministrator }] = createResource(() => trpc.instance.user.getIsAdministrator.query(props.userId), {
    initialValue: false,
  });
  const [isMe] = createResource(() => trpc.instance.user.getIsMe.query(props.userId), {
    initialValue: false,
  });

  return (
    <>
      <UKStackItem
        leading={{
          type: "icon",
          value: isAdministrator() ? SHIELD_PERSON_ICON : PERSON_ICON,
        }}
        labelText={`${isMe() ? "(YOU) - " : ""} ${forename()} ${surname() !== "undefined" ? surname() : ""}`}
        supportingText={`(${props.userId}) ${username()}`}
        onClick={() => setShowDialog("user")}
      />
      <UKDialog show={() => showDialog() === "user"} onClose={() => setShowDialog(undefined)}>
        <div class={styles.expanded}>
          <UKText role="title" size="l">
            Modify User
          </UKText>
          <UKDivider direction="horizontal" />
          <UKTextField
            color="outlined"
            onValueChange={async (val) => {
              if (val === username()) return;

              setUsername(val);
              await trpc.instance.user.setUsername.mutate({
                userId: props.userId,
                username: val,
              });
            }}
            defaultValue={username()}
            label="Username"
            value={username()}
          />
          <div class={styles.name}>
            <UKTextField
              color="outlined"
              onValueChange={async (val) => {
                if (val === forename()) return;

                setForename(val);
                await trpc.instance.user.setForename.mutate({
                  userId: props.userId,
                  forename: val,
                });
              }}
              defaultValue={forename()}
              label="Forename"
              value={forename()}
            />
            <UKTextField
              color="outlined"
              onValueChange={async (val) => {
                if (val === surname()) return;

                setSurname(val);
                await trpc.instance.user.setSurname.mutate({
                  userId: props.userId,
                  surname: val,
                });
              }}
              defaultValue={surname()}
              label="Surname"
              value={surname()}
            />
          </div>
          <UKTextField
            color="outlined"
            onValueChange={async (val) => {
              if (val === email()) return;

              setEmail(val);
              await trpc.instance.user.setEmail.mutate({
                userId: props.userId,
                email: val,
              });
            }}
            defaultValue={email()}
            label="Email"
            value={email()}
          />
          <div class={styles.boolean}>
            <UKText role="label" size="m">
              Is Administrator
            </UKText>
            <UKSwitch
              disabled={isMe() && !appContext.shootYourselfInTheFoot()}
              onValueChange={async (val) => {
                if (isMe() && !val) {
                  setShowDialog("removeOwnAdmin");
                  return;
                }
                setIsAdministrator(val);
                await trpc.instance.user.setIsAdministrator.mutate({
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
              onClick={async () => {
                // send a boop notification
                await trpc.instance.user.boop.mutate({ userId: props.userId });
              }}
            >
              Boop
            </UKButton>
            {/* FIXME: TODO: add warning dialog */}
            <UKButton
              color={"standard"}
              onClick={async () => {
                setShowDialog("confirmDelete");
              }}
            >
              Delete
            </UKButton>
          </UKButtonGroup>
          <UKButton
            class={styles.closeButton}
            color={"filled"}
            onClick={() => {
              setShowDialog(undefined);
            }}
          >
            Close
          </UKButton>
        </div>
      </UKDialog>
      <UKDialog show={() => showDialog() === "confirmDelete"} onClose={() => setShowDialog(undefined)}>
        <UKText role="title" size="l">
          Confirm Deletion
        </UKText>
        <UKDivider direction="horizontal" />
        <Show when={!isMe()}>
          <UKText role="body" size="m">
            Are you sure you want to delete this user? This action cannot be undone.
          </UKText>
          <UKButtonGroup size={"s"} align={"end"}>
            <UKButton
              color={"tonal"}
              onClick={async () => {
                await trpc.instance.user.delete.mutate({
                  userId: props.userId,
                });
                props.updateUsers();
              }}
            >
              Yes, delete
            </UKButton>
            <UKButton color={"filled"} onClick={() => setShowDialog(undefined)}>
              No, cancel
            </UKButton>
          </UKButtonGroup>
        </Show>
        <Show when={isMe()}>
          <UKText role="body" size="m">
            Sorry, you cannot delete your own user account. Please ask another administrator to delete your account if you wish to do so.
          </UKText>
          <UKButton color={"filled"} onClick={() => setShowDialog(undefined)}>
            Close
          </UKButton>
        </Show>
      </UKDialog>
      <UKDialog show={() => showDialog() === "removeOwnAdmin"} onClose={() => setShowDialog(undefined)}>
        <UKText role="title" size="l">
          Remove Administrator Privileges
        </UKText>
        <UKDivider direction="horizontal" />
        <UKText role="body" size="m">
          Are you sure you want to remove your own administrator privileges? You will not be able to modify any users or settings if you do this. Please ask
          another administrator or use the console if you need to restore your privileges.
        </UKText>
        <UKButtonGroup size={"s"} align={"end"}>
          <UKButton
            color={"tonal"}
            onClick={async () => {
              setIsAdministrator(false);
              await trpc.instance.user.setIsAdministrator.mutate({
                administrator: false,
                userId: props.userId,
              });
              setShowDialog(undefined);
            }}
          >
            Yes, remove
          </UKButton>
          <UKButton color={"filled"} onClick={() => setShowDialog("user")}>
            Cancel
          </UKButton>
        </UKButtonGroup>
      </UKDialog>
    </>
  );
};

export default User;
