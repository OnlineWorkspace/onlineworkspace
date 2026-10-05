import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKDivider from "@ewsgit/uikit-solid/src/components/divider/UKDivider.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import OtpInput from "@onlineworkspace/workspace-web/src/components/OtpInput/OtpInput.tsx";
import trpc from "@onlineworkspace/workspace-web/src/lib/trpc";
import QRCode from "qrcode";
import { type Component, createEffect, createSignal, For, Match, Show, Switch } from "solid-js";
import styles from "./TwoFactorCreateCodeDialog.module.scss";

type Stage = "verifyCurrent" | "setup" | "done";

const TwoFactorCreateCodeDialog: Component<{
  /** Whether the user already has an authenticator; replacing it requires proving they hold the current one */
  hasTwoFactor: boolean;
  onDone: () => void;
  onClose: () => void;
}> = (props) => {
  const [stage, setStage] = createSignal<Stage>(props.hasTwoFactor ? "verifyCurrent" : "setup");
  const [secret, setSecret] = createSignal<{ twoFactorSecret: string; twoFactorSecretURI: string } | undefined>(undefined);
  const [error, setError] = createSignal<string | undefined>(undefined);
  const [busy, setBusy] = createSignal(false);
  const [attempt, setAttempt] = createSignal(0);
  let canvasElement: HTMLCanvasElement | undefined;

  const failAndReset = (message: string) => {
    setError(message);
    setAttempt((value) => value + 1);
  };

  const startSetup = async (currentTwoFactorCode?: string) => {
    setBusy(true);
    setError(undefined);

    try {
      const result = await trpc.authorization.enableTwoFactor.mutate(currentTwoFactorCode ? { currentTwoFactorCode } : undefined);

      if (!result) {
        failAndReset(props.hasTwoFactor ? "That code was incorrect, or there have been too many attempts" : "Failed to start setup, please try again");
        return;
      }

      setSecret(result);
      setAttempt((value) => value + 1);
      setStage("setup");
    } catch {
      failAndReset("Something went wrong, please try again");
    } finally {
      setBusy(false);
    }
  };

  // A fresh account has nothing to verify first
  if (!props.hasTwoFactor) void startSetup();

  createEffect(() => {
    const value = secret();

    if (!value || !canvasElement || stage() !== "setup") return;

    QRCode.toCanvas(canvasElement, value.twoFactorSecretURI, (qrError) => {
      if (qrError) console.error(qrError);
    });
  });

  const confirm = async (code: string) => {
    setBusy(true);
    setError(undefined);

    try {
      if (await trpc.authorization.confirmTwoFactor.mutate({ twoFactorCode: code })) {
        setStage("done");
        props.onDone();
      } else {
        failAndReset("That code was incorrect, check your authenticator app and try again");
      }
    } catch {
      failAndReset("Something went wrong, please try again");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div class={styles.root}>
      <UKText role={"title"} size={"l"} emphasized={true}>
        {props.hasTwoFactor ? "Reset" : "Setup"} Two Factor Authentication
      </UKText>
      <UKDivider direction={"horizontal"} />
      <Switch>
        <Match when={stage() === "verifyCurrent"}>
          <UKText role={"body"} size={"m"}>
            Enter the 6-digit code from your current authenticator app to continue.
          </UKText>
          <For each={[attempt()]}>
            {() => <OtpInput error={!!error()} disabled={busy()} onChange={() => setError(undefined)} onComplete={(code) => startSetup(code)} />}
          </For>
        </Match>
        <Match when={stage() === "setup"}>
          <div class={styles.qr}>
            <canvas ref={canvasElement} />
            <UKText role={"body"} size={"m"}>
              {`secret: ${secret()?.twoFactorSecret || "..."}`}
            </UKText>
          </div>
          <UKText role={"body"} size={"m"}>
            Scan the code with your authenticator app, then enter the 6-digit code it shows to finish.
          </UKText>
          <For each={[attempt()]}>
            {() => <OtpInput error={!!error()} disabled={busy() || !secret()} onChange={() => setError(undefined)} onComplete={confirm} />}
          </For>
        </Match>
        <Match when={stage() === "done"}>
          <UKText role={"body"} size={"m"}>
            Two factor authentication is now set up. You'll be asked for a code from your authenticator app each time you sign in.
          </UKText>
          <div class={styles.singleButtonGroup}>
            <UKButton color={"filled"} onClick={props.onClose}>
              Done
            </UKButton>
          </div>
        </Match>
      </Switch>
      <Show when={error()}>
        <UKText role={"body"} size={"s"} class={styles.error}>
          {error()}
        </UKText>
      </Show>
    </div>
  );
};

export default TwoFactorCreateCodeDialog;
