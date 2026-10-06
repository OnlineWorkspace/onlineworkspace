import FEMALE_ICON from "@material-symbols/svg-700/outlined/female.svg";
import MALE_ICON from "@material-symbols/svg-700/outlined/male.svg";
import TRANSGENDER_ICON from "@material-symbols/svg-700/outlined/transgender.svg";
import UKAvatar from "@ewsgit/uikit-solid/src/components/avatar/UKAvatar.tsx";
import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.tsx";
import UKIcon from "@ewsgit/uikit-solid/src/components/icon/UKIcon.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import UKTextField from "@ewsgit/uikit-solid/src/components/textField/UKTextField.tsx";
import clsx from "clsx";
import { type Accessor, type Component, For, Show } from "solid-js";
import { UserSelectStage } from "../../Signup";
import modalStyles from "../../Signup.module.scss";
import StageHeader from "../../components/StageHeader/StageHeader";
import styles from "./Profile.module.scss";

const GENDERS = [
  { id: "female", icon: FEMALE_ICON, label: "Female" },
  { id: "male", icon: MALE_ICON, label: "Male" },
  { id: "other", icon: TRANSGENDER_ICON, label: "Other" },
];

const PRONOUN_OPTIONS = [
  { id: "he/him", parts: ["he", "him"] },
  { id: "she/her", parts: ["she", "her"] },
  { id: "they/them", parts: ["they", "them"] },
  { id: "it/its", parts: ["it", "its"] },
  { id: "any", parts: ["any"] },
];

/** female/male imply their pronouns, "other" uses the ones picked */
export const pronounsFor = (gender: string, pronouns: string) => (gender === "female" ? "she/her" : gender === "male" ? "he/him" : pronouns);

const Profile: Component<{
  username: Accessor<string>;
  displayName: Accessor<string>;
  gender: Accessor<string>;
  setGender(gender: string): void;
  pronouns: Accessor<string>;
  setPronouns(pronouns: string): void;
  bio: Accessor<string>;
  setBio(bio: string): void;
  setDisplayName(displayName: string): void;
  setStage(stage: UserSelectStage): void;
  previousStage: UserSelectStage;
}> = (props) => {
  // pronouns are stored as a comma separated list, as more than one set can apply
  const selectedPronouns = () =>
    props
      .pronouns()
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
  const hasPronoun = (id: string) => selectedPronouns().includes(id);
  const togglePronoun = (id: string) =>
    props.setPronouns(
      (hasPronoun(id) ? selectedPronouns().filter((p) => p !== id) : [...selectedPronouns(), id])
        .sort((a, b) => PRONOUN_OPTIONS.findIndex((o) => o.id === a) - PRONOUN_OPTIONS.findIndex((o) => o.id === b))
        .join(", "),
    );
  const shownPronouns = () => pronounsFor(props.gender(), props.pronouns());

  return (
    <UKCard color={"filled"} class={clsx(modalStyles.modal, styles.profileStage)}>
      <StageHeader title={"Set up your profile"} description={"This is how you'll appear to other people on this workspace. You can change it any time in settings."} />
      <div class={styles.preview}>
        <UKAvatar size={"l"} username={props.username()} avatar={"/assets/placeholder/avatar.png"} />
        <div class={styles.identity}>
          <UKText class={styles.displayName} role={"headline"} align={"start"} size={"m"} emphasized={true}>
            {props.displayName() || props.username()}
          </UKText>
          <UKText class={styles.username} role={"label"} align={"start"} size={"l"}>
            {`@${props.username()}`}
            <Show when={shownPronouns()}>{` · ${shownPronouns()}`}</Show>
          </UKText>
        </div>
      </div>
      <UKTextField color={"outlined"} label={"Display Name"} defaultValue={props.displayName()} value={props.displayName()} onValueChange={props.setDisplayName} />
      <div class={styles.section}>
        <UKText role={"title"} size={"s"} align={"start"} class={styles.sectionTitle}>
          Gender
        </UKText>
        <div class={styles.genders} role="radiogroup" aria-label="Gender">
          <For each={GENDERS}>
            {(gender) => (
              <button
                type="button"
                role="radio"
                aria-checked={props.gender() === gender.id}
                class={styles.gender}
                data-selected={props.gender() === gender.id}
                onClick={() => props.setGender(gender.id)}
              >
                <UKIcon>{gender.icon}</UKIcon>
                <UKText role="label" size="l">
                  {gender.label}
                </UKText>
              </button>
            )}
          </For>
        </div>
      </div>
      <Show when={props.gender() === "other"}>
        <div class={styles.section}>
          <UKText role={"title"} size={"s"} align={"start"} class={styles.sectionTitle}>
            Pronouns
          </UKText>
          <div class={styles.pronouns} role="group" aria-label="Pronouns">
            <For each={PRONOUN_OPTIONS}>
              {(option) => (
                <button type="button" class={styles.pronoun} aria-pressed={hasPronoun(option.id)} data-selected={hasPronoun(option.id)} onClick={() => togglePronoun(option.id)}>
                  <For each={option.parts}>
                    {(part) => (
                      <UKText role="label" size="l" class={styles.pronounPart}>
                        {part}
                      </UKText>
                    )}
                  </For>
                </button>
              )}
            </For>
          </div>
        </div>
      </Show>
      <UKTextField color={"outlined"} label={"Bio"} as={"textarea"} value={props.bio()} defaultValue={props.bio()} onValueChange={props.setBio} />
      <div class={modalStyles.stageButtons}>
        <UKButton onClick={() => props.setStage(props.previousStage)} color={"tonal"}>
          Back
        </UKButton>
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
