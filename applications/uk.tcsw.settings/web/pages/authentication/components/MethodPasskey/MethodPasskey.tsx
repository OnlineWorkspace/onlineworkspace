import UKButton from "@tcsw/uikit-solid/src/components/button/UKButton.jsx";
import UKStackItem from "@tcsw/uikit-solid/src/components/stack/UKStackItem.jsx";
import { type Component, createResource, Suspense } from "solid-js";
import trpc from "../../../../lib/trpc";
import styles from "./MethodPasskey.module.scss";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.jsx";
import UKIcon from "@tcsw/uikit-solid/src/components/icon/UKIcon.jsx";

const MethodPasskey: Component = () => {
  const [hasPasskey, { refetch: refetchHasPasskey }] = createResource(() =>
    trpc.authentication.hasPasskey.query(),
  );

  return (
    <UKStackItem
      leading={{
        type: "icon",
        value: "passkey",
        alt: "Passkey",
      }}
      labelText="Login with Passkey"
      supportingText={
        hasPasskey()
          ? "You have passkey authentication enabled"
          : "Setup passkey authentication"
      }
      inlineComponent={
        hasPasskey() && <UKIcon class={styles.enabledIcon}>check</UKIcon>
      }
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
                refetchHasPasskey();
                return 0;
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
