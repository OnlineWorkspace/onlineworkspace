import ASSIGNMENT_IND_ICON from "@material-symbols/svg-700/outlined/assignment_ind.svg";
import UKButton from "@tcsw/uikit-solid/src/components/button/UKButton.jsx";
import UKStackItem from "@tcsw/uikit-solid/src/components/stack/UKStackItem.jsx";
import UKTextField from "@tcsw/uikit-solid/src/components/textField/UKTextField.jsx";
import { type Component, createResource } from "solid-js";
import trpc from "../../../../lib/trpc";
import styles from "./Name.module.scss";

const Name: Component<{ refetchName(): void }> = (props) => {
  const [name, { mutate: setName, refetch: refetchName }] = createResource(() => trpc.profile.getName.query());

  return (
    <UKStackItem
      leading={{
        type: "icon",
        value: ASSIGNMENT_IND_ICON,
      }}
      labelText="Name"
      supportingText={name()}
      onCollapse={() => {
        refetchName();
      }}
      expandedComponent={
        <div class={styles.expanded}>
          <UKTextField color="outlined" onValueChange={setName} defaultValue={name()} value={name() || "Untitled User"} label="Name" />
          <UKButton
            class={styles.button}
            onClick={async () => {
              await trpc.profile.setName.mutate(name() || "");

              refetchName();
              props.refetchName();
            }}
          >
            Save
          </UKButton>
        </div>
      }
    />
  );
};

export default Name;
