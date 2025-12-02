import UKStackItem from "@tcsw/uikit-solid/src/components/stack/UKStackItem.jsx";
import { createResource, type Component } from "solid-js";
import trpc from "../../../../lib/trpc";
import UKTextField from "@tcsw/uikit-solid/src/components/textField/UKTextField.jsx";
import styles from "./Name.module.scss";
import UKButton from "@tcsw/uikit-solid/src/components/button/UKButton.jsx";

const Name: Component = () => {
    const [name, { mutate: setName, refetch: refetchName }] = createResource(() => trpc.profile.getName.query());

    return (
        <UKStackItem
            leading={{
                type: "icon",
                value: "assignment_ind",
            }}
            labelText="Name"
            supportingText={name()}
            onCollapse={() => {
                refetchName();
            }}
            expandedComponent={
                <div class={styles.expanded}>
                    <UKTextField color="outlined" getValue={setName} defaultValue={name()} label="Name" />
                    <UKButton
                        class={styles.button}
                        onClick={() => {
                            refetchName();
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
