import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.jsx";
import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.jsx";
import UKDivider from "@ewsgit/uikit-solid/src/components/divider/UKDivider.jsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.jsx";
import UKTextField from "@ewsgit/uikit-solid/src/components/textField/UKTextField.jsx";
import { type Accessor, type Component, createSignal } from "solid-js";
import trpc from "../../../../../lib/trpc";
import { UserSelectStage } from "../../Signup";
import modalStyles from "../../Signup.module.scss";
import styles from "./VerifyEmail.module.scss";

const VerifyEmail: Component<{
  emailAddress: Accessor<string>;
  emailCode: Accessor<string>;
  setEmailCode(emailCode: string): void;
  setStage(stage: UserSelectStage): void;
  isEmailCodeValid: Accessor<boolean>;
  setIsEmailCodeValid(isValid: boolean): void;
}> = (props) => {
  return (
    <>
      <UKCard color={"filled"} class={modalStyles.modal}>
        <UKText role={"title"} size={"l"} emphasized={true}>
          Verify Email
        </UKText>
        <UKDivider direction={"horizontal"} />
        <UKText role={"body"} size={"m"}>
          Please enter the code which was sent to the email you provided to continue.
        </UKText>
        <UKTextField
          color={"outlined"}
          label={"Email Verification Code*"}
          defaultValue={props.emailCode()}
          onValueChange={async (value) => {
            props.setEmailCode(value);

            props.setIsEmailCodeValid(
              await trpc.authorization.validateEmailCode.query({
                emailAddress: props.emailAddress(),
                emailCode: props.emailCode(),
              }),
            );
          }}
          maximumCharacterCount={8}
          supportingText={"*required"}
        />
        <div class={modalStyles.stageButtons}>
          <UKButton
            onClick={() => {
              props.setStage(UserSelectStage.Email);
            }}
            color={"tonal"}
          >
            Back
          </UKButton>
          <UKButton
            disabled={props.emailCode() === "" || !props.isEmailCodeValid()}
            onClick={() => {
              props.setStage(UserSelectStage.Password);
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

export default VerifyEmail;
