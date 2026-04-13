import ASSIGNMENT_IND_ICON from "@material-symbols/svg-700/outlined/assignment_ind.svg";
import UKButton from "@onlineworkspace/uikit-solid/src/components/button/UKButton.jsx";
import UKStackItem from "@onlineworkspace/uikit-solid/src/components/stack/UKStackItem.jsx";
import UKTextField from "@onlineworkspace/uikit-solid/src/components/textField/UKTextField.jsx";
import { type Component, createSignal, onCleanup, onMount, type Resource } from "solid-js";
import trpc from "../../../../lib/trpc";
import styles from "./Name.module.scss";

const Name: Component<{ name: Resource<string>; mutateName(name: string): void; refetchName(): void }> = (props) => {
  const [definitiveName, setDefinitiveName] = createSignal<string>("");

  onMount(() => {
    setDefinitiveName(props.name() || "Untitled User");
  });

  onCleanup(() => {
    props.mutateName(definitiveName());
  });

  return (
    <UKStackItem
      leading={{
        type: "icon",
        value: ASSIGNMENT_IND_ICON,
      }}
      labelText="Name"
      supportingText={props.name()}
      onCollapse={() => {
        props.mutateName(definitiveName());
      }}
      expandedComponent={
        <div class={styles.expanded}>
          <UKTextField color="outlined" onValueChange={props.mutateName} defaultValue={props.name()} value={props.name() || "Untitled User"} label="Name" />
          <UKButton
            class={styles.button}
            onClick={async () => {
              await trpc.profile.setName.mutate(props.name() || "Untitled User");

              setDefinitiveName(props.name() || "Untitled User");
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
