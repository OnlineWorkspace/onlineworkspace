import UKStackItem from "@tcsw/uikit-solid/src/components/stack/UKStackItem.jsx";
import { createResource, type Component } from "solid-js";
import trpc from "../../../../lib/trpc";
import styles from "./Username.module.scss";
import UKButton from "@tcsw/uikit-solid/src/components/button/UKButton.jsx";
import UKTextField from "@tcsw/uikit-solid/src/components/textField/UKTextField.jsx";

const Username: Component = () => {
    const [username, { mutate: setUsername, refetch: refetchUsername }] = createResource(() => trpc.profile.getUsername.query());

    return (
        <UKStackItem
            leading={{
                type: "icon",
                value: "alternate_email",
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
                        defaultValue={username()}
                        label="Username"
                        leadingIcon={{ icon: "alternate_email" }}
                    />
                    <UKButton
                        class={styles.button}
                        onClick={() => {
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
