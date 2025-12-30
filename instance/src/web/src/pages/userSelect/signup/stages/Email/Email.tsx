import type { Accessor, Component } from "solid-js";
import styles from "./Email.module.scss";
import modalStyles from "../../Signup.module.scss";
import { UserSelectStage } from "../../Signup";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.jsx";
import UKCard from "@tcsw/uikit-solid/src/components/card/UKCard.jsx";
import UKTextField from "@tcsw/uikit-solid/src/components/textField/UKTextField.jsx";
import UKDivider from "@tcsw/uikit-solid/src/components/divider/UKDivider.jsx";
import UKButton from "@tcsw/uikit-solid/src/components/button/UKButton.jsx";
import isEmail from "@tcsw/uikit-solid/src/core/validation/isEmail.js";
import trpc from "../../../../../lib/trpc";

const Email: Component<{
    setStage(stage: UserSelectStage): void;
    emailAddress: Accessor<string>;
    setEmailAddress(emailAddress: string): void;
    setEmailCode(emailCode: string): void;
}> = (props) => {
    return (
        <>
            <UKCard color={"filled"} class={modalStyles.modal}>
                <UKText role={"title"} size={"l"} emphasized={true}>
                    Set Email
                </UKText>
                <UKDivider direction={"horizontal"} />
                <UKTextField
                    color={"outlined"}
                    label={"Email Address*"}
                    defaultValue={props.emailAddress()}
                    getValue={props.setEmailAddress}
                    supportingText={"*required"}
                    error={props.emailAddress() !== "" && !isEmail(props.emailAddress())}
                />
                <div class={modalStyles.stageButtons}>
                    <UKButton
                        onClick={() => {
                            props.setStage(UserSelectStage.Username);
                        }}
                        color={"tonal"}
                    >
                        Back
                    </UKButton>
                    <UKButton
                        disabled={props.emailAddress() === "" || !isEmail(props.emailAddress())}
                        onClick={async () => {
                            await trpc.authorization.checkEmailAddressOwnership.mutate({
                                emailAddress: props.emailAddress(),
                            });

                            props.setStage(UserSelectStage.VerifyEmail);
                        }}
                        color={"filled"}
                    >
                        Continue
                    </UKButton>
                </div>
            </UKCard>
        </>
    );
};

export default Email;
