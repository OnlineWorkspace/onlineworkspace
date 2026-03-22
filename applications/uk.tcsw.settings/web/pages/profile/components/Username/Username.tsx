import ALTERNATE_EMAIL_ICON from "@material-symbols/svg-500/outlined/alternate_email.svg";
import UKButton from "@tcsw/uikit-solid/src/components/button/UKButton.jsx";
import UKStackItem from "@tcsw/uikit-solid/src/components/stack/UKStackItem.jsx";
import UKTextField from "@tcsw/uikit-solid/src/components/textField/UKTextField.jsx";
import { type Component, createResource } from "solid-js";
import trpc from "../../../../lib/trpc";
import styles from "./Username.module.scss";

const Username: Component = () => {
  const [username, { mutate: setUsername, refetch: refetchUsername }] = createResource(() =>
    trpc.profile.getUsername.query(),
  );

  return (
    <UKStackItem
      leading={{
        type: "icon",
        value: ALTERNATE_EMAIL_ICON,
      }}
      labelText="Username"
      supportingText={username()}
      onCollapse={() => {
        refetchUsername();
      }}
      expandedComponent={
        <div class={styles.expanded}>
          <UKTextField
            color="outlined"
            getValue={setUsername}
            setValue={username() || "no username"}
            defaultValue={username()}
            label="Username"
            leadingIcon={{ icon: ALTERNATE_EMAIL_ICON }}
          />
          <UKButton
            class={styles.button}
            onClick={async () => {
              await trpc.profile.setUsername.mutate(username() || "");

              refetchUsername();
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
