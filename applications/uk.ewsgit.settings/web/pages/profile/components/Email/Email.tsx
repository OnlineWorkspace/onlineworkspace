import MAIL_ICON from "@material-symbols/svg-700/outlined/mail.svg";
import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKStackItem from "@ewsgit/uikit-solid/src/components/stack/UKStackItem.tsx";
import UKTextField from "@ewsgit/uikit-solid/src/components/textField/UKTextField.tsx";
import { type Component, createResource } from "solid-js";
import trpc from "../../../../lib/trpc";
import styles from "./Email.module.scss";

const Email: Component = () => {
  const [email, { mutate: setEmail, refetch: refetchEmail }] = createResource(() => trpc.profile.getEmail.query());

  return (
    <UKStackItem
      leading={{
        type: "icon",
        value: MAIL_ICON,
      }}
      labelText="Email"
      supportingText={email()}
      onCollapse={() => {
        refetchEmail();
      }}
      expandedComponent={
        <div class={styles.expanded}>
          <UKTextField color="outlined" onValueChange={setEmail} defaultValue={email()} value={email() || "unknown@example.com"} label="Email" />
          <UKButton
            class={styles.button}
            onClick={async () => {
              await trpc.profile.setEmail.mutate(email() || "");

              refetchEmail();
            }}
          >
            Save
          </UKButton>
        </div>
      }
    />
  );
};

export default Email;
