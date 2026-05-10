import UKDivider from "@ewsgit/uikit-solid/src/components/divider/UKDivider.jsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.jsx";
import UKTextField from "@ewsgit/uikit-solid/src/components/textField/UKTextField.jsx";
import trpc from "@onlineworkspace/workspace-instance-web/src/lib/trpc";
import QRCode from "qrcode";
import { type Component, createEffect, createResource, createSignal } from "solid-js";
import styles from "./TwoFactorCreateCodeDialog.module.scss";

const TwoFactorCreateCodeDialog: Component = () => {
  const [twoFactorSecret] = createResource(() => trpc.authorization.enableTwoFactor.mutate());
  const [twoFactorTestCode, setTwoFactorTestCode] = createSignal("");
  let canvasElement!: HTMLCanvasElement;

  createEffect(() => {
    const twoFactorSecretValue = twoFactorSecret();

    if (!twoFactorSecretValue) return;

    QRCode.toCanvas(canvasElement, twoFactorSecretValue?.twoFactorSecretURI || "https://http.cat/404", (error) => {
      if (error) console.error(error);
    });
  });

  return (
    <div>
      <UKText role={"title"} size={"l"} emphasized={true}>
        Setup Two Factor Authentication
      </UKText>
      <UKDivider direction={"horizontal"} />
      <div class={styles.qr}>
        <canvas ref={canvasElement} />
        <UKText role={"body"} size={"m"}>
          {`secret: ${twoFactorSecret()?.twoFactorSecret || "..."}`}
        </UKText>
      </div>
      <UKTextField
        color={"outlined"}
        label={"Two Factor Code*"}
        defaultValue={twoFactorTestCode()}
        onValueChange={async (value) => {
          if (value.length === 6) {
            const isValid = await trpc.authorization.confirmTwoFactor.mutate({
              twoFactorCode: value,
            });

            if (isValid) {
            }
          }
        }}
        supportingText={"*required"}
        maximumCharacterCount={6}
      />
    </div>
  );
};

export default TwoFactorCreateCodeDialog;
