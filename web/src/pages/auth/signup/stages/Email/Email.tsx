import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import UKTextField from "@ewsgit/uikit-solid/src/components/textField/UKTextField.tsx";
import type { Accessor, Component } from "solid-js";
import z from "zod";
import trpc from "../../../../../lib/trpc";
import { UserSelectStage } from "../../Signup";
import StageHeader from "../../components/StageHeader/StageHeader";
import modalStyles from "../../Signup.module.scss";

const Email: Component<{
  setStage(stage: UserSelectStage): void;
  emailAddress: Accessor<string>;
  setEmailAddress(emailAddress: string): void;
  setEmailCode(emailCode: string): void;
}> = (props) => {
  return (
    <UKCard color={"filled"} class={modalStyles.modal}>
      <StageHeader title={"Add your email"} description={"We will send a verification code to this address."} />
      <UKTextField
        color={"outlined"}
        label={"Email Address*"}
        defaultValue={props.emailAddress()}
        onValueChange={props.setEmailAddress}
        supportingText={"*required"}
        error={props.emailAddress() !== "" && !z.safeParse(z.email(), props.emailAddress()).data}
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
          disabled={props.emailAddress() === "" || !z.safeParse(z.email(), props.emailAddress()).data}
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
  );
};

export default Email;
