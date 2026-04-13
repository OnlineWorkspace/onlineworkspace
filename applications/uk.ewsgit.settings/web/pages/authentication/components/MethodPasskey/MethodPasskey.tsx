import CHECK_ICON from "@material-symbols/svg-700/outlined/check.svg";
import PASSKEY_ICON from "@material-symbols/svg-700/outlined/passkey.svg";
import UKButton, { AffirmativeButtonState } from "@onlineworkspace/uikit-solid/src/components/button/UKButton.jsx";
import UKIcon from "@onlineworkspace/uikit-solid/src/components/icon/UKIcon.jsx";
import UKStackItem from "@onlineworkspace/uikit-solid/src/components/stack/UKStackItem.jsx";
import UKText from "@onlineworkspace/uikit-solid/src/components/text/UKText.jsx";
import { startRegistration } from "@simplewebauthn/browser";
import { type Component, createResource, createSignal, onMount, Suspense } from "solid-js";
import trpc from "../../../../lib/trpc";
import Passkeys from "./components/Passkeys/Passkeys";
import styles from "./MethodPasskey.module.scss";

const MethodPasskey: Component = () => {
  const [supportsPasskeys, setSupportsPasskeys] = createSignal<boolean>(false);
  const [hasPasskey, { refetch: refetchHasPasskey }] = createResource(() => trpc.authentication.hasPasskey.query());
  const [refetchCounter, setRefetchCounter] = createSignal(0);

  onMount(async () => {
    if (window.PublicKeyCredential && PublicKeyCredential.getClientCapabilities) {
      const capabilities = await PublicKeyCredential.getClientCapabilities();
      if (capabilities.conditionalGet === true && capabilities.passkeyPlatformAuthenticator === true) {
        setSupportsPasskeys(true);
      }
    }
  });

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
              Use a passkey to login to your Workspace account. This is more secure {"&"} convenient than a password and can be used with biometric
              authentication on supported devices.
            </UKText>
            <Suspense>
              <Passkeys refetch={refetchCounter()} />
            </Suspense>
            <UKButton
              disabled={!supportsPasskeys()}
              affirmative={true}
              class={styles.button}
              onClick={async () => {
                const creationOptions = await trpc.authentication.requestNewPasskey.mutate();

                const authenticatorResponse = await startRegistration({ optionsJSON: creationOptions });

                const verified = await trpc.authentication.registerPasskey.mutate(authenticatorResponse);

                if (verified) {
                  return {
                    state: AffirmativeButtonState.Success,
                    cb: async () => {
                      setRefetchCounter((c) => c + 1);
                      await refetchHasPasskey();
                    },
                  };
                }

                return {
                  state: AffirmativeButtonState.Error,
                };
              }}
            >
              Create a new Passkey
            </UKButton>
          </div>
        </Suspense>
      }
    />
  );
};

export default MethodPasskey;
