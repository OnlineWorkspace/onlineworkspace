import PERSON_ICON from "@material-symbols/svg-700/outlined/person.svg";
import { useNavigate } from "@solidjs/router";
import UKButton from "@tcsw/uikit-solid/src/components/button/UKButton.jsx";
import UKCard from "@tcsw/uikit-solid/src/components/card/UKCard.jsx";
import UKDivider from "@tcsw/uikit-solid/src/components/divider/UKDivider.jsx";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.jsx";
import UKTextField from "@tcsw/uikit-solid/src/components/textField/UKTextField.jsx";
import clsx from "clsx";
import type { Accessor, Component, Resource } from "solid-js";
import trpc from "../../../../../lib/trpc";
import { UserSelectStage } from "../../Signup";
import modalStyles from "../../Signup.module.scss";
import styles from "./Username.module.scss";

const Username: Component<{
  setStage(stage: UserSelectStage): void;
  username: Accessor<string>;
  setUsername(username: string): void;
  requirements: Resource<{
    email: boolean;
  }>;
  isUsernameValid: Accessor<boolean>;
  setIsUsernameValid(isValid: boolean): void;
}> = (props) => {
  const navigate = useNavigate();

  return (
    <>
      <UKCard color={"filled"} class={clsx(modalStyles.modal, styles.usernameStage)}>
        <UKText role={"title"} size={"l"} emphasized={true}>
          Signup
        </UKText>
        <UKDivider direction={"horizontal"} />
        <UKTextField
          leadingIcon={{ icon: PERSON_ICON }}
          color={"outlined"}
          label={"Username*"}
          supportingText={"*required"}
          defaultValue={props.username()}
          onValueChange={async (val) => {
            props.setUsername(val);

            if (await trpc.authorization.isUsernameValid.query(val)) {
              props.setIsUsernameValid(true);
            } else {
              props.setIsUsernameValid(false);
            }
          }}
          onSubmit={() => {
            if (props.username() !== "") props.setStage(UserSelectStage.Email);
          }}
        />
        <div class={styles.stageButtons}>
          <UKButton
            disabled={props.username() === "" || !props.isUsernameValid()}
            onClick={() => {
              if (props.requirements()?.email) {
                props.setStage(UserSelectStage.Email);
              } else {
                props.setStage(UserSelectStage.Password);
              }
            }}
            color={"filled"}
          >
            Continue
          </UKButton>
        </div>
        <UKDivider direction={"horizontal"} />
        <div class={styles.loginSegment}>
          <UKText role={"body"} size={"m"}>
            Already have an account?
          </UKText>
          <UKButton onClick={() => navigate("/")} color={"tonal"}>
            Login
          </UKButton>
        </div>
      </UKCard>
    </>
  );
};

export default Username;
