import UKButton from "@tcsw/uikit-solid/src/components/button/UKButton.jsx";
import UKStackItem from "@tcsw/uikit-solid/src/components/stack/UKStackItem.jsx";
import {createResource, Suspense, type Component} from "solid-js";
import trpc from "../../../../lib/trpc";
import styles from "./MethodPasskey.module.scss"
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.jsx";
import UKIcon from "@tcsw/uikit-solid/src/components/icon/UKIcon.jsx";

const MethodPasskey: Component = () => {
    const [ hasPassword, {refetch: refetchHasPassword} ] = createResource(() => trpc.authentication.hasPassword.query());

    return (
        <UKStackItem
            leading={{
                type: "icon",
                value: "passkey",
            }}
            labelText="Login with Passkey"
            supportingText={hasPassword() ? "You have password authentication enabled" : "Setup password authentication"}
            onCollapse={() => {
                refetchHasPassword();
            }}
            inlineComponent={hasPassword() && <UKIcon class={styles.enabledIcon}>check</UKIcon>}
            expandedComponent={
                <Suspense>
                <div class={styles.expanded}>
                    <UKText role="body" size="m">
                        Use a passkey to login to your Tricolor Workspaces account.
                    </UKText>
                        <UKButton
                            disabled={!hasPassword()}
                        class={styles.button}
                        onClick={async () => {
                            return 0
                        }}
                    >
                            Enable experimental passkey support
                    </UKButton>
                    </div>
                </Suspense>
            }
        />
    );
}

export default MethodPasskey