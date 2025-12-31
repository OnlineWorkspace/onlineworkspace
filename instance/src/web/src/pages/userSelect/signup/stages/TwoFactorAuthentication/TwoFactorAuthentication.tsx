import UKButton from "@tcsw/uikit-solid/src/components/button/UKButton.jsx";
import UKCard from "@tcsw/uikit-solid/src/components/card/UKCard.jsx";
import UKDivider from "@tcsw/uikit-solid/src/components/divider/UKDivider.jsx";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.jsx";
import UKTextField from "@tcsw/uikit-solid/src/components/textField/UKTextField.jsx";
import {
    createEffect,
    createResource,
    type Accessor,
    type Component,
    createSignal,
    type Resource,
} from "solid-js";
import { UserSelectStage } from "../../Signup";
import clsx from "clsx";
import modalStyles from "../../Signup.module.scss";
import styles from "./TwoFactorAuthentication.module.scss";
import QRCode from "qrcode";
import trpc from "../../../../../lib/trpc";

const TwoFactorAuthentication: Component<{
    twoFactorTestCode: Accessor<string>;
    setTwoFactorTestCode(testCode: string): void;
    setStage(stage: UserSelectStage): void;
    requirements: Resource<{ twoFactorAuthentication?: boolean }>;
}> = (props) => {
    const [isTwoFactorCodeValid, setIsTwoFactorCodeValid] = createSignal<boolean>(false);
    const [twoFactorSecret] = createResource(() => trpc.authorization.enableTwoFactor.mutate());
    let canvasElement!: HTMLCanvasElement;

    createEffect(() => {
        let twoFactorSecretValue = twoFactorSecret();

        if (!twoFactorSecretValue) return;

        QRCode.toCanvas(
            canvasElement,
            twoFactorSecretValue?.twoFactorSecretURI || "https://http.cat/404",
            function (error) {
                if (error) console.error(error);
            },
        );
    });

    return (
        <>
            {isTwoFactorCodeValid() ? (
                <UKCard color={"filled"} class={clsx(modalStyles.modal, styles.twoFactorStage)}>
                    <UKText role={"title"} size={"l"} emphasized={true}>
                        Two Factor Setup Complete!
                    </UKText>
                    <UKDivider direction={"horizontal"} />
                    <UKText role={"body"} size={"m"}>
                        You have successfully setup two-factor authentication on your account!
                    </UKText>
                    <UKDivider direction={"horizontal"} />
                    <div class={clsx(styles.stageButtons, styles.singleButtonGroup)}>
                        <UKButton
                            onClick={() => {
                                props.setStage(UserSelectStage.GuidePrompt);
                            }}
                            color={"filled"}
                        >
                            Continue
                        </UKButton>
                    </div>
                </UKCard>
            ) : (
                <UKCard color={"filled"} class={clsx(modalStyles.modal, styles.twoFactorStage)}>
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
                        defaultValue={props.twoFactorTestCode()}
                        getValue={async (value) => {
                            props.setTwoFactorTestCode(value);

                            if (value.length === 6) {
                                setIsTwoFactorCodeValid(
                                    await trpc.authorization.confirmTwoFactor.mutate({
                                        twoFactorCode: value,
                                    }),
                                );
                            }
                        }}
                        supportingText={"*required"}
                        maximumCharacterCount={6}
                    />
                    {!props.requirements()?.twoFactorAuthentication && (
                        <>
                            <UKDivider direction={"horizontal"} />
                            <UKButton
                                class={styles.skipButton}
                                onClick={() => {
                                    props.setStage(UserSelectStage.GuidePrompt);
                                }}
                                color={"standard"}
                            >
                                Skip Two Factor Setup
                            </UKButton>
                        </>
                    )}
                </UKCard>
            )}
        </>
    );
};

export default TwoFactorAuthentication;
