import CHECK_ICON from "@material-symbols/svg-700/outlined/check.svg";
import PASSKEY_ICON from "@material-symbols/svg-700/outlined/passkey.svg";
import UKButton from "@onlineworkspace/uikit-solid/src/components/button/UKButton.jsx";
import UKIcon from "@onlineworkspace/uikit-solid/src/components/icon/UKIcon.jsx";
import UKStackItem from "@onlineworkspace/uikit-solid/src/components/stack/UKStackItem.jsx";
import UKText from "@onlineworkspace/uikit-solid/src/components/text/UKText.jsx";
import { type Component, createResource, Suspense } from "solid-js";
import trpc from "../../../../lib/trpc";

import styles from "./MethodPasskey.module.scss";

const MethodPasskey: Component = () => {
  const [hasPasskey, { refetch: refetchHasPasskey }] = createResource(() => trpc.authentication.hasPasskey.query());

  return (
    <UKStackItem
      leading={{
        type: "icon",
        value: PASSKEY_ICON,
        alt: "Passkey",
      }}
      labelText="Login with Passkey"
      supportingText={hasPasskey() ? "You have passkey authentication enabled" : "Setup passkey authentication"}
      inlineComponent={hasPasskey() && <UKIcon class={styles.enabledIcon}>{CHECK_ICON}</UKIcon>}
      expandedComponent={
        <Suspense>
          <div class={styles.expanded}>
            <UKText role="body" size="m">
              Use a passkey to login to your Workspace account.
            </UKText>
            <UKButton
              disabled={true}
              class={styles.button}
              onClick={async () => {
                await refetchHasPasskey();
                return;
              }}
            >
              Enable experimental passkey support
            </UKButton>
          </div>
        </Suspense>
      }
    />
  );
};

export default MethodPasskey;
