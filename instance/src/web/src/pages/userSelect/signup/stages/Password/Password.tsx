import UKButton from "@onlineworkspace/uikit-solid/src/components/button/UKButton.jsx";
import UKCard from "@onlineworkspace/uikit-solid/src/components/card/UKCard.jsx";
import { DividerDirection } from "@onlineworkspace/uikit-solid/src/components/divider/lib/direction.js";
import UKDivider from "@onlineworkspace/uikit-solid/src/components/divider/UKDivider.jsx";
import UKText from "@onlineworkspace/uikit-solid/src/components/text/UKText.jsx";
import UKTextField from "@onlineworkspace/uikit-solid/src/components/textField/UKTextField.jsx";
import type { Accessor, Component, Resource } from "solid-js";
import { UserSelectStage } from "../../Signup";
import modalStyles from "../../Signup.module.scss";
import Requirement from "./components/Requirement/Requirement";
import styles from "./Password.module.scss";

const Password: Component<{
  password: Accessor<string>;
  setPassword(password: string): void;
  confirmedPassword: Accessor<string>;
  setConfirmedPassword(password: string): void;
  setStage(stage: UserSelectStage): void;
  requirements: Resource<{
    email: boolean;
    passwordMinimumLength?: number;
    passwordContains?: {
      minimumLowercase?: number;
      minimumNumbers?: number;
      minimumSymbols?: number;
      minimumUppercase?: number;
    };
  }>;
}> = (props) => {
  return (
    <UKCard color={"filled"} class={modalStyles.modal}>
      <UKText role={"title"} size={"l"} emphasized={true}>
        Create a strong password
      </UKText>
      <UKDivider direction={DividerDirection.horizontal} />
      <UKText role={"title"} size={"m"}>
        Password Requirements
      </UKText>
      <div class={styles.requirements}>
        <Requirement
          shouldDisplay={props.requirements()?.passwordMinimumLength !== undefined}
          checkValue={props.password().length > (props.requirements()?.passwordMinimumLength || 0)}
          label={`Is at least ${props.requirements()?.passwordMinimumLength} characters long`}
        />
        <Requirement
          shouldDisplay={props.requirements()?.passwordContains?.minimumLowercase !== undefined}
          checkValue={(props.password()?.match(/[a-z]/g)?.length || 0) >= (props.requirements()?.passwordContains?.minimumLowercase || 0)}
          label={`Contains at least ${props.requirements()?.passwordContains?.minimumLowercase} lowercase letter`}
        />
        <Requirement
          shouldDisplay={props.requirements()?.passwordContains?.minimumUppercase !== undefined}
          checkValue={(props.password()?.match(/[A-Z]/g)?.length || 0) >= (props.requirements()?.passwordContains?.minimumUppercase || 0)}
          label={`Contains at least ${props.requirements()?.passwordContains?.minimumUppercase} uppercase letter`}
        />
        <Requirement
          shouldDisplay={props.requirements()?.passwordContains?.minimumNumbers !== undefined}
          checkValue={(props.password()?.match(/[0-9]/g)?.length || 0) >= (props.requirements()?.passwordContains?.minimumNumbers || 0)}
          label={`Contains at least ${props.requirements()?.passwordContains?.minimumNumbers} number`}
        />
        <Requirement
          shouldDisplay={props.requirements()?.passwordContains?.minimumSymbols !== undefined}
          checkValue={(props.password()?.match(/[^a-zA-Z0-9]/g)?.length || 0) >= (props.requirements()?.passwordContains?.minimumSymbols || 0)}
          label={`Contains at least ${props.requirements()?.passwordContains?.minimumSymbols} special character`}
        />
      </div>
      <UKDivider direction={DividerDirection.horizontal} />
      <UKTextField
        shouldMask={true}
        color={"outlined"}
        label={"Password*"}
        defaultValue={props.password()}
        value={props.password()}
        onValueChange={props.setPassword}
        supportingText={"*required"}
        error={props.password() !== props.confirmedPassword()}
      />
      <UKTextField
        shouldMask={true}
        color={"outlined"}
        label={"Confirm Password*"}
        defaultValue={props.confirmedPassword()}
        value={props.confirmedPassword()}
        onValueChange={props.setConfirmedPassword}
        supportingText={"*required"}
        error={props.password() !== props.confirmedPassword()}
      />
      <div class={modalStyles.stageButtons}>
        <UKButton
          onClick={() => {
            if (props.requirements()?.email) {
              props.setStage(UserSelectStage.VerifyEmail);
            } else {
              props.setStage(UserSelectStage.Username);
            }
          }}
          color={"tonal"}
        >
          Back
        </UKButton>
        <UKButton
          disabled={
            props.password() !== props.confirmedPassword() ||
            props.password() === "" ||
            !(
              props.password().length > (props.requirements()?.passwordMinimumLength || 0) &&
              (props.password()?.match(/[a-z]/g)?.length || 0) >= (props.requirements()?.passwordContains?.minimumLowercase || 0) &&
              (props.password()?.match(/[A-Z]/g)?.length || 0) >= (props.requirements()?.passwordContains?.minimumUppercase || 0) &&
              (props.password()?.match(/[0-9]/g)?.length || 0) >= (props.requirements()?.passwordContains?.minimumNumbers || 0)
            )
          }
          onClick={() => {
            props.setStage(UserSelectStage.Profile);
          }}
          color={"filled"}
        >
          Continue
        </UKButton>
      </div>
    </UKCard>
  );
};

export default Password;
