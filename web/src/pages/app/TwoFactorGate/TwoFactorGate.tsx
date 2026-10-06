import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import UKTextField from "@ewsgit/uikit-solid/src/components/textField/UKTextField.tsx";
import { useNavigate } from "@solidjs/router";
import QRCode from "qrcode";
import { type Component, createEffect, createResource, createSignal, Show } from "solid-js";
import trpc from "../../../lib/trpc.ts";
import styles from "./TwoFactorGate.module.scss";

/** Administrators can do nothing until they have set up two factor authentication, so this is shown instead of the instance. */
const TwoFactorGate: Component = () => {
  const navigate = useNavigate();
  const [secret] = createResource(() => trpc.authorization.enableTwoFactor.mutate());
  const [incorrect, setIncorrect] = createSignal(false);
  let canvas!: HTMLCanvasElement;

  createEffect(() => {
    const current = secret();

    if (current) QRCode.toCanvas(canvas, current.twoFactorSecretURI, (error) => error && console.error(error));
  });

  return (
    <div class={styles.page}>
      <UKCard color="filled" class={styles.card}>
        <UKText role="headline" size="s" emphasized={true} align="start">
          Set up two-factor authentication
        </UKText>
        <UKText role="body" size="m" align="start" class={styles.hint}>
          Administrators have to use two-factor authentication, as what they can do would be very bad in the wrong hands. Scan the code with an authenticator app, then enter the code it shows.
        </UKText>
        <div class={styles.qr}>
          <canvas ref={canvas} />
          <UKText role="body" size="s" class={styles.hint}>
            {`or enter this secret: ${secret()?.twoFactorSecret ?? "..."}`}
          </UKText>
        </div>
        <UKTextField
          color="outlined"
          label="Code from your authenticator"
          maximumCharacterCount={6}
          error={incorrect()}
          onValueChange={async (value) => {
            setIncorrect(false);

            if (value.trim().length !== 6) return;

            if (await trpc.authorization.confirmTwoFactor.mutate({ twoFactorCode: value.trim() })) {
              // everything is loaded again now that nothing is held back
              window.location.reload();
            } else {
              setIncorrect(true);
            }
          }}
        />
        <Show when={incorrect()}>
          <UKText role="body" size="s" align="start" class={styles.error}>
            That code was not correct, try the next one it shows.
          </UKText>
        </Show>
        <div class={styles.actions}>
          <UKButton
            color="tonal"
            onClick={async () => {
              await trpc.authorization.logout.mutate();
              navigate("/");
            }}
          >
            Sign out
          </UKButton>
        </div>
      </UKCard>
    </div>
  );
};

export default TwoFactorGate;
