import UKDivider from "@ewsgit/uikit-solid/src/components/divider/UKDivider.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import { type Component, createEffect, createResource, For, Show, Suspense } from "solid-js";
import trpc from "../../../../../../lib/trpc";
import Passkey from "./components/Passkey/Passkey";
import styles from "./Passkeys.module.scss";

const Passkeys: Component<{ refetch: number }> = (props) => {
  const [passkeys, { refetch: refetchPasskeys }] = createResource(() => trpc.authentication.getPasskeys.query());

  createEffect(() => {
    props.refetch;

    refetchPasskeys();
  });

  return (
    <Show when={(passkeys()?.length || 0) > 0}>
      <UKDivider direction="horizontal" />
      <UKText role="title" size="m">
        Your Passkeys
      </UKText>
      <div class={styles.passkeys}>
        <Suspense>
          <For each={passkeys()}>{(passkey) => <Passkey {...passkey} refetchPasskeys={refetchPasskeys} />}</For>
        </Suspense>
      </div>
      <UKDivider direction="horizontal" />
    </Show>
  );
};

export default Passkeys;
