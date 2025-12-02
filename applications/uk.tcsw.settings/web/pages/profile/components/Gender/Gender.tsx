import UKStackItem from "@tcsw/uikit-solid/src/components/stack/UKStackItem.jsx";
import { createResource, type Component } from "solid-js";
import trpc from "../../../../lib/trpc";
import styles from "./Gender.module.scss";
import UKButton from "@tcsw/uikit-solid/src/components/button/UKButton.jsx";
import { SearchableDropdownMenuItemType } from "@tcsw/uikit-solid/src/components/searchableDropdownMenu/lib/items.js";
import UKSearchableDropdownMenu from "@tcsw/uikit-solid/src/components/searchableDropdownMenu/UKSearchableDropdownMenu.jsx";

const Gender: Component = () => {
    const [gender, { mutate: setGender, refetch: refetchGender }] = createResource(() => trpc.profile.getGender.query());

    return (
        <UKStackItem
            leading={{
                type: "icon",
                value: "person",
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
                        // @ts-ignore
                        getValue={(val) => setGender(val.toLowerCase())}
                        items={[
                            {
                                type: SearchableDropdownMenuItemType.Button,
                                label: "Female",
                            },
                            {
                                type: SearchableDropdownMenuItemType.Button,
                                label: "Male",
                            },
                            {
                                type: SearchableDropdownMenuItemType.Button,
                                label: "Other",
                            },
                        ]}
                    />
                    <UKButton
                        class={styles.button}
                        onClick={() => {
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
