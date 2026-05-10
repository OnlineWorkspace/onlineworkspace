import DESCRIPTION_ICON from "@material-symbols/svg-700/outlined/description.svg";
import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.jsx";
import UKStackItem from "@ewsgit/uikit-solid/src/components/stack/UKStackItem.jsx";
import UKTextField from "@ewsgit/uikit-solid/src/components/textField/UKTextField.jsx";
import { type Component, createResource } from "solid-js";
import trpc from "../../../../lib/trpc";
import styles from "./Bio.module.scss";

const Bio: Component = () => {
  const [bio, { mutate: setBio, refetch: refetchBio }] = createResource(() => trpc.profile.getBio.query());

  return (
    <UKStackItem
      leading={{
        type: "icon",
        value: DESCRIPTION_ICON,
      }}
      labelText="Bio"
      supportingText={"Tell people a bit about yourself"}
      onCollapse={() => {
        refetchBio();
      }}
      expandedComponent={
        <div class={styles.expanded}>
          <UKTextField as={"textarea"} color="outlined" onValueChange={setBio} value={bio() || "Missing bio"} defaultValue={bio()} label="Bio" />
          <UKButton
            class={styles.button}
            onClick={async () => {
              await trpc.profile.setBio.mutate(bio() || "");

              refetchBio();
            }}
          >
            Save
          </UKButton>
        </div>
      }
    />
  );
};

export default Bio;
