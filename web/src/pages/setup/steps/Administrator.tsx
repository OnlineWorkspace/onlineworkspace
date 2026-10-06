import MAIL_ICON from "@material-symbols/svg-700/outlined/mail.svg";
import PERSON_ICON from "@material-symbols/svg-700/outlined/person.svg";
import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.tsx";
import UKIcon from "@ewsgit/uikit-solid/src/components/icon/UKIcon.tsx";
import UKAvatar from "@ewsgit/uikit-solid/src/components/avatar/UKAvatar.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import UKTextField from "@ewsgit/uikit-solid/src/components/textField/UKTextField.tsx";
import { type Component, createSignal, For, Show } from "solid-js";
import Requirement from "../../auth/signup/stages/Password/components/Requirement/Requirement";
import { GENDERS, PRONOUN_OPTIONS } from "../../auth/signup/stages/Profile/Profile";
import profileStyles from "../../auth/signup/stages/Profile/Profile.module.scss";
import StepPage from "../components/StepPage/StepPage";
import styles from "../Setup.module.scss";
import { passwordIssues } from "../state";
import type { StepProps } from "./types";

export const USERNAME_PATTERN = /^[a-z0-9_.-]{2,32}$/;

const profileIsValid = (state: StepProps["state"]) => USERNAME_PATTERN.test(state.administrator.username.toLowerCase()) && state.administrator.displayName.trim() !== "";

/** the administrator has no default password so this step is always a form */
export const administratorIsValid = (state: StepProps["state"]) => {
  const admin = state.administrator;

  return USERNAME_PATTERN.test(admin.username.toLowerCase()) && admin.displayName.trim() !== "" && passwordIssues(admin.password, state.access).length === 0 && admin.password === admin.confirmPassword;
};

const Administrator: Component<StepProps> = (props) => {
  // the profile and the password are two pages of the one step
  const [page, setPage] = createSignal<"profile" | "password">("profile");
  const admin = () => props.state.administrator;
  const access = () => props.state.access;
  const count = (re: RegExp) => admin().password.match(re)?.length ?? 0;
  const issues = () => passwordIssues(admin().password, access());
  const mismatch = () => admin().confirmPassword !== "" && admin().password !== admin().confirmPassword;

  const selectedPronouns = () =>
    admin()
      .pronouns.split(",")
      .map((p) => p.trim())
      .filter(Boolean);
  const hasPronoun = (id: string) => selectedPronouns().includes(id);
  const togglePronoun = (id: string) =>
    props.setState(
      "administrator",
      "pronouns",
      (hasPronoun(id) ? selectedPronouns().filter((p) => p !== id) : [...selectedPronouns(), id]).sort((a, b) => PRONOUN_OPTIONS.findIndex((o) => o.id === a) - PRONOUN_OPTIONS.findIndex((o) => o.id === b)).join(", "),
    );

  const profilePage = () => (
    <>
      <div class={styles.adminPreview}>
        <UKAvatar size={"l"} username={admin().username} avatar={"/assets/placeholder/avatar.png"} />
        <div class={styles.adminIdentity}>
          <UKText role={"headline"} size={"m"} align={"start"} emphasized={true} class={styles.adminName}>
            {admin().displayName || admin().username || "Administrator"}
          </UKText>
          <UKText role={"label"} size={"l"} align={"start"} class={styles.adminHandle}>
            {`@${admin().username}`}
          </UKText>
        </div>
      </div>
      <UKTextField leadingIcon={{ icon: PERSON_ICON }} color={"outlined"} label={"Username*"} supportingText={"Letters, numbers, '.', '_' and '-'"} defaultValue={admin().username} onValueChange={(v) => props.setState("administrator", "username", v.trim())} error={admin().username !== "" && !USERNAME_PATTERN.test(admin().username.toLowerCase())} autocomplete={"username"} />
      <UKTextField color={"outlined"} label={"Display name*"} defaultValue={admin().displayName} onValueChange={(v) => props.setState("administrator", "displayName", v)} />
      <UKTextField leadingIcon={{ icon: MAIL_ICON }} color={"outlined"} label={"Email (optional)"} defaultValue={admin().email} onValueChange={(v) => props.setState("administrator", "email", v.trim())} autocomplete={"email"} />
      <div class={profileStyles.section}>
        <UKText role={"title"} size={"s"} align={"start"} class={profileStyles.sectionTitle}>
          Gender
        </UKText>
        <div class={profileStyles.genders} role="radiogroup" aria-label="Gender">
          <For each={GENDERS}>
            {(gender) => (
              <button type="button" role="radio" aria-checked={admin().gender === gender.id} class={profileStyles.gender} data-selected={admin().gender === gender.id} onClick={() => props.setState("administrator", "gender", gender.id as "female" | "male" | "other")}>
                <UKIcon>{gender.icon}</UKIcon>
                <UKText role="label" size="l">
                  {gender.label}
                </UKText>
              </button>
            )}
          </For>
        </div>
      </div>
      <Show when={admin().gender === "other"}>
        <div class={profileStyles.section}>
          <UKText role={"title"} size={"s"} align={"start"} class={profileStyles.sectionTitle}>
            Pronouns
          </UKText>
          <div class={profileStyles.pronouns} role="group" aria-label="Pronouns">
            <For each={PRONOUN_OPTIONS}>
              {(option) => (
                <button type="button" class={profileStyles.pronoun} aria-pressed={hasPronoun(option.id)} data-selected={hasPronoun(option.id)} onClick={() => togglePronoun(option.id)}>
                  <For each={option.parts}>
                    {(part) => (
                      <UKText role="label" size="l" class={profileStyles.pronounPart}>
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
    </>
  );

  const passwordPage = () => (
    <>
      <UKText role={"title"} size={"m"} align={"start"}>
        Password requirements
      </UKText>
      <div class={styles.adminRequirements}>
        <Requirement shouldDisplay={access().passwordMinimumLength > 0} checkValue={admin().password.length >= access().passwordMinimumLength} label={`Is at least ${access().passwordMinimumLength} characters long`} />
        <Requirement shouldDisplay={access().passwordContains.minimumLowercase > 0} checkValue={count(/[a-z]/g) >= access().passwordContains.minimumLowercase} label={`Contains at least ${access().passwordContains.minimumLowercase} lowercase letter`} />
        <Requirement shouldDisplay={access().passwordContains.minimumUppercase > 0} checkValue={count(/[A-Z]/g) >= access().passwordContains.minimumUppercase} label={`Contains at least ${access().passwordContains.minimumUppercase} uppercase letter`} />
        <Requirement shouldDisplay={access().passwordContains.minimumNumbers > 0} checkValue={count(/[0-9]/g) >= access().passwordContains.minimumNumbers} label={`Contains at least ${access().passwordContains.minimumNumbers} number`} />
        <Requirement shouldDisplay={access().passwordContains.minimumSymbols > 0} checkValue={count(/[^a-zA-Z0-9]/g) >= access().passwordContains.minimumSymbols} label={`Contains at least ${access().passwordContains.minimumSymbols} special character`} />
      </div>
      <UKTextField shouldMask={true} color={"outlined"} label={"Password*"} defaultValue={admin().password} onValueChange={(v) => props.setState("administrator", "password", v)} autocomplete={"new-password"} supportingText={"*required"} error={admin().password !== "" && issues().length > 0} />
      <UKTextField shouldMask={true} color={"outlined"} label={"Confirm password*"} defaultValue={admin().confirmPassword} onValueChange={(v) => props.setState("administrator", "confirmPassword", v)} autocomplete={"new-password"} supportingText={"*required"} error={mismatch()} />
      <Show when={mismatch()}>
        <UKText role={"body"} size={"s"} align={"start"} class={styles.error}>
          The passwords do not match
        </UKText>
      </Show>
    </>
  );

  return (
    <StepPage
      title={page() === "profile" ? "Create the administrator" : "Choose a password"}
      description={page() === "profile" ? "This account manages the instance. It replaces the temporary account the server started with." : "Pick something strong that you have not used elsewhere."}
      actions={
        <>
          <Show when={page() === "password" || props.onBack} fallback={<span />}>
            <UKButton color={"outlined"} onClick={() => (page() === "password" ? setPage("profile") : props.onBack?.())}>
              Back
            </UKButton>
          </Show>
          <UKButton color={"filled"} disabled={page() === "profile" ? !profileIsValid(props.state) : !administratorIsValid(props.state)} onClick={() => (page() === "profile" ? setPage("password") : props.onNext())}>
            Continue
          </UKButton>
        </>
      }
    >
      <UKCard color={"filled"} class={styles.adminCard}>
        <Show when={page() === "profile"} fallback={passwordPage()}>
          {profilePage()}
        </Show>
      </UKCard>
    </StepPage>
  );
};

export default Administrator;
