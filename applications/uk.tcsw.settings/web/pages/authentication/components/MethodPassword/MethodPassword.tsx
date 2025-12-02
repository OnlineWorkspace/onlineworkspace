import UKButton from "@tcsw/uikit-solid/src/components/button/UKButton.jsx";
import UKStackItem from "@tcsw/uikit-solid/src/components/stack/UKStackItem.jsx";
import {createResource, type Component} from "solid-js";
import trpc from "../../../../lib/trpc";
import styles from "./MethodPassword.module.scss"
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.jsx";
import UKIcon from "@tcsw/uikit-solid/src/components/icon/UKIcon.jsx";

const MethodPassword: Component = () => {
    const [ hasPassword, {refetch: refetchHasPassword} ] = createResource(() => trpc.authentication.hasPassword.query());

    return (
        <UKStackItem
            leading={{
                type: "icon",
                value: "password",
            }}
            labelText="Login with Password"
            supportingText={hasPassword() ? "You have password authentication enabled" : "Setup password authentication"}
            onCollapse={() => {
                refetchHasPassword();
            }}
            inlineComponent={hasPassword() && <UKIcon class={styles.enabledIcon}>check</UKIcon>}
            expandedComponent={
                <div class={styles.expanded}>
                    <UKText role="body" size="m">
                        Use a password to login to your Tricolor Workspaces account.
                    </UKText>
                    <UKButton
                        class={styles.button}
                        onClick={async () => {
                            return 0
                        }}
                    >
                        {hasPassword() ? "Reset" : "Set"} password
                    </UKButton>
                </div>
            }
        />
    );
}

export default MethodPassword