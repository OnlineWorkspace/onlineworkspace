import ALTERNATE_EMAIL_ICON from "@material-symbols/svg-700/outlined/alternate_email.svg";
import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.jsx";
import UKStackItem from "@ewsgit/uikit-solid/src/components/stack/UKStackItem.jsx";
import UKTextField from "@ewsgit/uikit-solid/src/components/textField/UKTextField.jsx";
import { type Component, createResource, createSignal, onCleanup, onMount } from "solid-js";
import trpc from "../../../../lib/trpc";
import styles from "./Username.module.scss";

const Username: Component = () => {
  const [definitiveUsername, setDefinitiveUsername] = createSignal<string>("");
  const [username, setUsername] = createSignal<string>("");

  onMount(async () => {
    setDefinitiveUsername(await trpc.profile.getUsername.query());
    setUsername(definitiveUsername());
  });

  onCleanup(() => {
    setUsername(definitiveUsername());
  });

  return (
    <UKStackItem
      leading={{
        type: "icon",
        value: ALTERNATE_EMAIL_ICON,
      }}
      labelText="Username"
      supportingText={username()}
      onCollapse={() => {
        setUsername(definitiveUsername());
      }}
      expandedComponent={
        <div class={styles.expanded}>
          <UKTextField
            color="outlined"
            onValueChange={setUsername}
            value={username() || "no username"}
            defaultValue={username()}
            label="Username"
            leadingIcon={{ icon: ALTERNATE_EMAIL_ICON }}
          />
          <UKButton
            class={styles.button}
            onClick={async () => {
              await trpc.profile.setUsername.mutate(username() || "");

              setDefinitiveUsername(username());
            }}
          >
            Save
          </UKButton>
        </div>
      }
    />
  );
};

export default Username;
