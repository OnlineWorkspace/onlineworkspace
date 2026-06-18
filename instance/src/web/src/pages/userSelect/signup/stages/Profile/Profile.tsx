import UKAvatar from "@ewsgit/uikit-solid/src/components/avatar/UKAvatar.jsx";
import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.jsx";
import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.jsx";
import { DividerDirection } from "@ewsgit/uikit-solid/src/components/divider/lib/direction.js";
import UKDivider from "@ewsgit/uikit-solid/src/components/divider/UKDivider.jsx";
import UKSearchableDropdownMenu from "@ewsgit/uikit-solid/src/components/searchableDropdownMenu/UKSearchableDropdownMenu.jsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.jsx";
import UKTextField from "@ewsgit/uikit-solid/src/components/textField/UKTextField.jsx";
import clsx from "clsx";
import type { Accessor, Component } from "solid-js";
import { UserSelectStage } from "../../Signup";
import modalStyles from "../../Signup.module.scss";
import styles from "./Profile.module.scss";

const Profile: Component<{
  username: Accessor<string>;
  displayName: Accessor<string>;
  gender: Accessor<string>;
  setGender(gender: string): void;
  bio: Accessor<string>;
  setBio(bio: string): void;
  setDisplayName(displayName: string): void;
  setStage(stage: UserSelectStage): void;
}> = (props) => {
  return (
    <UKCard color={"filled"} class={clsx(modalStyles.modal, styles.profileStage)}>
      <UKText role={"title"} size={"l"} emphasized={true}>
        Setup Profile
      </UKText>
      <UKDivider direction={DividerDirection.horizontal} />
      <UKAvatar containerClass={styles.avatar} size={"l"} username={props.username()} avatar={"/assets/placeholder/avatar.png"} />
      <UKText class={styles.displayName} role={"headline"} align={"center"} size={"l"} emphasized={true}>
        {props.displayName() || props.username()}
      </UKText>
      <UKText class={styles.username} role={"body"} align={"center"} size={"m"}>
        {`@${props.username()}`}
      </UKText>
      <UKText class={styles.pronouns} role={"label"} align={"center"} size={"s"}>
        {props.gender() === "female" ? "she/her" : props.gender() === "male" ? "he/him" : "they/them"}
      </UKText>
      <UKTextField
        color={"outlined"}
        label={"Display Name"}
        defaultValue={props.displayName()}
        value={props.displayName()}
        onValueChange={props.setDisplayName}
      />
      <UKSearchableDropdownMenu
        inputColor={"outlined"}
        label={"Gender"}
        defaultValue={props.gender()}
        // @ts-ignore
        onValueChange={(val) => props.setGender(val.toLowerCase())}
        items={[
          {
            id: "female",
            type: "button",
            label: "Female",
          },
          {
            id: "male",
            type: "button",
            label: "Male",
          },
          {
            id: "other",
            type: "button",
            label: "Other",
          },
        ]}
      />
      <UKTextField color={"outlined"} label={"Bio"} as={"textarea"} value={props.bio()} defaultValue={props.bio()} onValueChange={props.setBio} />
      <div class={styles.buttonContainer}>
        <UKButton
          onClick={() => {
            if (props.displayName() === "") {
              props.setDisplayName(props.username());
            }

            props.setStage(UserSelectStage.TermsOfUse);
          }}
          color={"filled"}
        >
          Continue
        </UKButton>
      </div>
    </UKCard>
  );
};

export default Profile;
