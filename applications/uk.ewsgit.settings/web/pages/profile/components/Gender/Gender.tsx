import PERSON_ICON from "@material-symbols/svg-700/outlined/person.svg";
import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKSearchableDropdownMenu from "@ewsgit/uikit-solid/src/components/searchableDropdownMenu/UKSearchableDropdownMenu.tsx";
import UKStackItem from "@ewsgit/uikit-solid/src/components/stack/UKStackItem.tsx";
import { type Component, createResource } from "solid-js";
import trpc from "../../../../lib/trpc";
import styles from "./Gender.module.scss";

const Gender: Component = () => {
  const [gender, { mutate: setGender, refetch: refetchGender }] = createResource(() => trpc.profile.getGender.query());

  return (
    <UKStackItem
      leading={{
        type: "icon",
        value: PERSON_ICON,
        alt: "",
      }}
      labelText="Gender"
      supportingText={gender()}
      onCollapse={() => {
        refetchGender();
      }}
      expandedComponent={
        <div class={styles.expanded}>
          <UKSearchableDropdownMenu
            inputColor={"outlined"}
            label={"Gender"}
            defaultValue={gender()}
            onValueChange={(val) => setGender(val)}
            items={[
              {
                type: "button",
                label: "Female",
                id: "female",
              },
              {
                type: "button",
                label: "Male",
                id: "male",
              },
              {
                type: "button",
                label: "Other",
                id: "other",
              },
            ]}
          />
          <UKButton
            class={styles.button}
            onClick={async () => {
              await trpc.profile.setGender.mutate(gender() || "other");

              refetchGender();
            }}
          >
            Save
          </UKButton>
        </div>
      }
    />
  );
};

export default Gender;
