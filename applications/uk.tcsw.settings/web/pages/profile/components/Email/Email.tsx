import UKStackItem from "@tcsw/uikit-solid/src/components/stack/UKStackItem.jsx";
import { createResource, type Component } from "solid-js";
import trpc from "../../../../lib/trpc";
import UKButton from "@tcsw/uikit-solid/src/components/button/UKButton.jsx";
import UKTextField from "@tcsw/uikit-solid/src/components/textField/UKTextField.jsx";
import styles from "./Email.module.scss";

const Email: Component = () => {
    const [email, { mutate: setEmail, refetch: refetchEmail }] = createResource(() => trpc.profile.getEmail.query());

    return (
        <UKStackItem
            leading={{
                type: "icon",
                value: "email",
            }}
            labelText="Email"
            supportingText={email()}
            onCollapse={() => {
                refetchEmail();
            }}
            expandedComponent={
                <div class={styles.expanded}>
                    <UKTextField color="outlined" getValue={setEmail} defaultValue={email()} label="Email" />
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
