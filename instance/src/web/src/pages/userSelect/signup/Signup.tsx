import UKAvatar from "@onlineworkspace/uikit-solid/src/components/avatar/UKAvatar.tsx";
import UKButton, { AffirmativeButtonState } from "@onlineworkspace/uikit-solid/src/components/button/UKButton.tsx";
import UKCard from "@onlineworkspace/uikit-solid/src/components/card/UKCard.tsx";
import { DividerDirection } from "@onlineworkspace/uikit-solid/src/components/divider/lib/direction.ts";
import UKDivider from "@onlineworkspace/uikit-solid/src/components/divider/UKDivider.tsx";
import UKIndeterminateSpinner from "@onlineworkspace/uikit-solid/src/components/indeterminateSpinner/UKIndeterminateSpinner.tsx";
import UKSearchableDropdownMenu from "@onlineworkspace/uikit-solid/src/components/searchableDropdownMenu/UKSearchableDropdownMenu.tsx";
import UKText from "@onlineworkspace/uikit-solid/src/components/text/UKText.tsx";
import UKTextField from "@onlineworkspace/uikit-solid/src/components/textField/UKTextField.tsx";
import { useNavigate, usePreloadRoute } from "@solidjs/router";
import clsx from "clsx";
import { type Component, createResource, createSignal, Match, Switch } from "solid-js";
import trpc from "../../../lib/trpc";
import styles from "./Signup.module.scss";
import Email from "./stages/Email/Email";
import Password from "./stages/Password/Password";
import Profile from "./stages/Profile/Profile";
import TermsOfUse from "./stages/TermsOfUse/TermsOfUse";
import TwoFactorAuthentication from "./stages/TwoFactorAuthentication/TwoFactorAuthentication";
import Username from "./stages/Username/Username";
import VerifyEmail from "./stages/VerifyEmail/VerifyEmail";

export enum UserSelectStage {
  Username, // set username
  Email, // set email
  VerifyEmail, // verify they own the email
  Password, // set password
  Profile, // set profile information
  TermsOfUse, // accept the terms of use for this instance
  TwoFactorAuthentication, // attempt to setup 2FA
  GuidePrompt, // prompt the user for if they want to see the introductory guide
  Guide, // guide the new user through the basics
}

const UserSelectPage: Component = () => {
  const navigate = useNavigate();
  const preload = usePreloadRoute();
  const [stage, setStage] = createSignal<UserSelectStage>(UserSelectStage.Username);

  const [username, setUsername] = createSignal<string>("");
  const [password, setPassword] = createSignal<string>("");
  const [confirmedPassword, setConfirmedPassword] = createSignal<string>("");
  const [emailAddress, setEmailAddress] = createSignal<`${string}@${string}.${string}` | "">("");
  const [emailCode, setEmailCode] = createSignal<string>("");
  const [displayName, setDisplayName] = createSignal<string>("");
  const [gender, setGender] = createSignal<"female" | "male" | "other">("other");
  const [bio, setBio] = createSignal<string>("");

  const [requirements] = createResource(() => trpc.authorization.signupRequirements.query());

  const [isUsernameValid, setIsUsernameValid] = createSignal<boolean>(false);
  const [twoFactorTestCode, setTwoFactorTestCode] = createSignal<string>("");
  const [isEmailCodeValid, setIsEmailCodeValid] = createSignal<boolean>(false);

  return (
    <Switch fallback={<UKIndeterminateSpinner />}>
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
        <Email setStage={setStage} emailAddress={emailAddress} setEmailAddress={setEmailAddress} setEmailCode={setEmailCode} />
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
        <UKCard color={"filled"} class={clsx(styles.modal, styles.guidePromptStage)}>
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
              onClick={() => {
                setStage(UserSelectStage.Guide);
              }}
              color={"filled"}
            >
              Continue
            </UKButton>
          </div>
        </UKCard>
      </Match>
      <Match when={stage() === UserSelectStage.Guide}>
        <UKCard color={"filled"} class={clsx(styles.modal, styles.guideStage)}>
          <UKText role={"title"} size={"l"} emphasized={true}>
            {"Unimplemented"}
          </UKText>
          <UKDivider direction={DividerDirection.horizontal} />
          <UKText role={"body"} size={"l"} align={"center"} emphasized={true}>
            {"The guide is not yet implemented"}
          </UKText>
          <UKDivider direction={DividerDirection.horizontal} />
          <div class={styles.continueSegment}>
            <UKButton onClick={() => navigate("/app")} color={"filled"}>
              Skip guide and continue
            </UKButton>
          </div>
        </UKCard>
      </Match>
    </Switch>
  );
};

export default UserSelectPage;
