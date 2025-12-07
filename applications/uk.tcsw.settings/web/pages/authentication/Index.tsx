import { Suspense, type Component } from "solid-js";
import styles from "./Index.module.scss";
import UKStack from "@tcsw/uikit-solid/src/components/stack/UKStack.jsx";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.jsx";
import MethodPassword from "./components/MethodPassword/MethodPassword";
import MethodTwoFactor from "./components/MethodTwoFactor/MethodTwoFactor";
import MethodPasskey from "./components/MethodPasskey/MethodPasskey";
import Sessions from "./components/Sessions/Sessions";
import UKIndeterminateSpinner from "@tcsw/uikit-solid/src/components/indeterminateSpinner/UKIndeterminateSpinner.jsx";

const AuthenticationPage: Component = () => {
    return (
        <Suspense fallback={<UKIndeterminateSpinner />}>
            <div class={styles.root}>
                <UKText class={styles.subheading} role="title" size="m" align="start">
                    Login methods
                </UKText>
                <UKStack>
                    <MethodPassword />
                    <MethodTwoFactor />
                    <MethodPasskey />
                </UKStack>
                <UKText class={styles.subheading} role="title" size="m" align="start">
                    Logged in devices
                </UKText>
                <UKStack>
                    <Sessions />
                </UKStack>
            </div>
        </Suspense>
    );
};

export default AuthenticationPage;
