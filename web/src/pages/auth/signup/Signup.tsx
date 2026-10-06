import UKButton, {
  AffirmativeButtonState,
} from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKCircularProgressIndicator from "@ewsgit/uikit-solid/src/components/circularProgressIndicator/UKCircularProgressIndicator.tsx";
import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.tsx";
import { DividerDirection } from "@ewsgit/uikit-solid/src/components/divider/lib/direction.ts";
import UKDivider from "@ewsgit/uikit-solid/src/components/divider/UKDivider.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import { useNavigate, usePreloadRoute } from "@solidjs/router";
import clsx from "clsx";
import {
  type Component,
  createResource,
  createSignal,
  Match,
  Show,
  Switch,
} from "solid-js";
import trpc from "../../../lib/trpc";
import styles from "./Signup.module.scss";
import Email from "./stages/Email/Email";
import Password from "./stages/Password/Password";
import StepIndicator from "./components/StepIndicator/StepIndicator";
import Profile, { pronounsFor } from "./stages/Profile/Profile";
import TermsOfUse from "./stages/TermsOfUse/TermsOfUse";
import TwoFactorAuthentication from "./stages/TwoFactorAuthentication/TwoFactorAuthentication";
import Username from "./stages/Username/Username";
import VerifyEmail from "./stages/VerifyEmail/VerifyEmail";

export enum UserSelectStage {
  Username = 0, // set username
  Email = 1, // set email
  VerifyEmail = 2, // verify they own the email
  Password = 3, // set password
  Profile = 4, // set profile information
  TermsOfUse = 5, // accept the terms of use for this instance
  TwoFactorAuthentication = 6, // attempt to setup 2FA
  GuidePrompt = 7, // prompt the user for if they want to see the introductory guide (the uk.ewsgit.guide application)
}

const UserSelectPage: Component = () => {
  const navigate = useNavigate();
  const preload = usePreloadRoute();
  const [stage, setStage] = createSignal<UserSelectStage>(
    UserSelectStage.Username,
  );

  const [username, setUsername] = createSignal<string>("");
  const [password, setPassword] = createSignal<string>("");
  const [confirmedPassword, setConfirmedPassword] = createSignal<string>("");
  const [emailAddress, setEmailAddress] = createSignal<
    `${string}@${string}.${string}` | ""
  >("");
  const [emailCode, setEmailCode] = createSignal<string>("");
  const [displayName, setDisplayName] = createSignal<string>("");
  const [gender, setGender] = createSignal<"female" | "male" | "other">(
    "female",
  );
  const [pronouns, setPronouns] = createSignal<string>("they/them");
  const [bio, setBio] = createSignal<string>("");

  const [requirements] = createResource(() =>
    trpc.userSelect.signupRequirements.query(),
  );

  const [isUsernameValid, setIsUsernameValid] = createSignal<boolean>(false);
  const [twoFactorTestCode, setTwoFactorTestCode] = createSignal<string>("");
  const [isEmailCodeValid, setIsEmailCodeValid] = createSignal<boolean>(false);

  // the stages the user will actually see, the email ones are only present when the instance requires an email
  const steps = () => {
    const list: { stage: UserSelectStage; label: string }[] = [{ stage: UserSelectStage.Username, label: "Username" }];
    if (requirements()?.email) {
      list.push({ stage: UserSelectStage.Email, label: "Email" }, { stage: UserSelectStage.VerifyEmail, label: "Verify email" });
    }
    list.push(
      { stage: UserSelectStage.Password, label: "Password" },
      { stage: UserSelectStage.Profile, label: "Profile" },
      { stage: UserSelectStage.TermsOfUse, label: "Terms of use" },
      { stage: UserSelectStage.TwoFactorAuthentication, label: "Two factor" },
    );
    return list;
  };
  const currentStep = () => steps().findIndex((step) => step.stage === stage());

  return (
    <div class={styles.flow}>
      <Show when={currentStep() !== -1}>
        <StepIndicator steps={steps().map((step) => step.label)} current={currentStep()} />
      </Show>
      <Switch fallback={<UKCircularProgressIndicator />}>
      <Match when={stage() === UserSelectStage.Username}>
        <Username
          setStage={setStage}
          setUsername={setUsername}
          username={username}
          requirements={requirements}
          isUsernameValid={isUsernameValid}
          setIsUsernameValid={setIsUsernameValid}
        />
      </Match>
      <Match when={stage() === UserSelectStage.Email}>
        <Email
          setStage={setStage}
          emailAddress={emailAddress}
          setEmailAddress={setEmailAddress}
          setEmailCode={setEmailCode}
        />
      </Match>
      <Match when={stage() === UserSelectStage.VerifyEmail}>
        <VerifyEmail
          emailAddress={emailAddress}
          setStage={setStage}
          emailCode={emailCode}
          setEmailCode={setEmailCode}
          isEmailCodeValid={isEmailCodeValid}
          setIsEmailCodeValid={setIsEmailCodeValid}
        />
      </Match>
      <Match when={stage() === UserSelectStage.Password}>
        <Password
          password={password}
          setPassword={setPassword}
          confirmedPassword={confirmedPassword}
          setConfirmedPassword={setConfirmedPassword}
          requirements={requirements}
          setStage={setStage}
        />
      </Match>
      <Match when={stage() === UserSelectStage.Profile}>
        <Profile
          username={username}
          displayName={displayName}
          setDisplayName={setDisplayName}
          gender={gender}
          setGender={setGender}
          pronouns={pronouns}
          setPronouns={setPronouns}
          previousStage={UserSelectStage.Password}
          bio={bio}
          setBio={setBio}
          setStage={setStage}
        />
      </Match>
      <Match when={stage() === UserSelectStage.TermsOfUse}>
        <TermsOfUse
          setStage={setStage}
          signup={async () => {
            // create the user
            const resp = await trpc.authorization.signup.mutate({
              username: username(),
              bio: bio(),
              displayName: displayName(),
              emailAddress: emailAddress(),
              emailCode: emailCode(),
              gender: gender(),
              pronouns: pronounsFor(gender(), pronouns()),
              password: password(),
            });

            if (resp.type === "success") {
              preload("/app/uk.ewsgit.dashboard");
              return {
                state: AffirmativeButtonState.Success,
                cb() {
                  setStage(UserSelectStage.TwoFactorAuthentication);
                },
              };
            } else {
              // TODO: add an error toast here instead of a console message (When implemented in UIKit of course)
              console.error(resp);
              alert("A critical error occurred!");

              return {
                state: AffirmativeButtonState.Error,
              };
            }
          }}
        />
      </Match>
      <Match when={stage() === UserSelectStage.TwoFactorAuthentication}>
        <TwoFactorAuthentication
          setStage={setStage}
          setTwoFactorTestCode={setTwoFactorTestCode}
          twoFactorTestCode={twoFactorTestCode}
          requirements={requirements}
        />
      </Match>
      <Match when={stage() === UserSelectStage.GuidePrompt}>
        <UKCard
          color={"filled"}
          class={clsx(styles.modal, styles.guidePromptStage)}
        >
          <UKText role={"title"} size={"l"} emphasized={true}>
            Guide
          </UKText>
          <UKDivider direction={DividerDirection.horizontal} />
          <UKText role={"body"} size={"l"} align={"center"}>
            {"Would you like to have a guide of your new workspace?"}
          </UKText>
          <UKDivider direction={DividerDirection.horizontal} />
          <div class={styles.continueSegment}>
            <UKButton onClick={() => navigate("/app")} color={"tonal"}>
              Skip guide
            </UKButton>
            <UKButton
              onClick={() => navigate("/app/uk.ewsgit.guide")}
              color={"filled"}
            >
              Continue
            </UKButton>
          </div>
        </UKCard>
      </Match>
      </Switch>
    </div>
  );
};

export default UserSelectPage;
