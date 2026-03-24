import { useNavigate } from "@solidjs/router";
import UKAvatar from "@tcsw/uikit-solid/src/components/avatar/UKAvatar.tsx";
import UKButton from "@tcsw/uikit-solid/src/components/button/UKButton.tsx";
import UKCard from "@tcsw/uikit-solid/src/components/card/UKCard.tsx";
import { DividerDirection } from "@tcsw/uikit-solid/src/components/divider/lib/direction.ts";
import UKDivider from "@tcsw/uikit-solid/src/components/divider/UKDivider.tsx";
import UKIndeterminateSpinner from "@tcsw/uikit-solid/src/components/indeterminateSpinner/UKIndeterminateSpinner.tsx";
import UKSearchableDropdownMenu from "@tcsw/uikit-solid/src/components/searchableDropdownMenu/UKSearchableDropdownMenu.tsx";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.tsx";
import UKTextField from "@tcsw/uikit-solid/src/components/textField/UKTextField.tsx";
import clsx from "clsx";
import { type Component, createResource, createSignal, Match, Switch } from "solid-js";
import trpc from "../../../lib/trpc";
import styles from "./Signup.module.scss";
import Email from "./stages/Email/Email";
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
        <UKCard color={"filled"} class={styles.modal}>
          <UKText role={"title"} size={"l"} emphasized={true}>
            Set Password
          </UKText>
          <UKDivider direction={DividerDirection.horizontal} />
          <UKTextField
            shouldMask={true}
            color={"outlined"}
            label={"Password*"}
            defaultValue={password()}
            setValue={password()}
            getValue={setPassword}
            supportingText={"*required"}
            error={password() !== confirmedPassword()}
          />
          <UKTextField
            shouldMask={true}
            color={"outlined"}
            label={"Confirm Password*"}
            defaultValue={confirmedPassword()}
            setValue={confirmedPassword()}
            getValue={setConfirmedPassword}
            supportingText={"*required"}
            error={password() !== confirmedPassword()}
          />
          <div class={styles.stageButtons}>
            <UKButton
              onClick={() => {
                if (requirements()?.email) {
                  setStage(UserSelectStage.VerifyEmail);
                } else {
                  setStage(UserSelectStage.Username);
                }
              }}
              color={"tonal"}
            >
              Back
            </UKButton>
            <UKButton
              disabled={password() !== confirmedPassword() || password() === ""}
              onClick={() => {
                setStage(UserSelectStage.Profile);
              }}
              color={"filled"}
            >
              Continue
            </UKButton>
          </div>
        </UKCard>
      </Match>
      <Match when={stage() === UserSelectStage.Profile}>
        <UKCard color={"filled"} class={clsx(styles.modal, styles.profileStage)}>
          <UKText role={"title"} size={"l"} emphasized={true}>
            Setup Profile
          </UKText>
          <UKDivider direction={DividerDirection.horizontal} />
          <UKAvatar
            class={styles.avatar}
            size={"l"}
            username={username()}
            avatar={"/assets/placeholder/avatar.png"}
          />
          <UKText
            class={styles.displayName}
            role={"headline"}
            align={"center"}
            size={"l"}
            emphasized={true}
          >
            {displayName() || username()}
          </UKText>
          <UKText class={styles.username} role={"body"} align={"center"} size={"m"}>
            {`@${username()}`}
          </UKText>
          <UKText class={styles.pronouns} role={"label"} align={"center"} size={"s"}>
            {gender() === "female" ? "she/her" : gender() === "male" ? "he/him" : "they/them"}
          </UKText>
          <UKTextField
            color={"outlined"}
            label={"Display Name"}
            defaultValue={displayName()}
            setValue={displayName()}
            getValue={setDisplayName}
          />
          <UKSearchableDropdownMenu
            inputColor={"outlined"}
            label={"Gender"}
            defaultValue={gender()}
            // @ts-ignore
            getValue={(val) => setGender(val.toLowerCase())}
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
          <UKTextField
            color={"outlined"}
            label={"Bio"}
            as={"textarea"}
            setValue={bio()}
            defaultValue={bio()}
            getValue={setBio}
          />
          <div class={styles.stageButtons}>
            <UKButton
              onClick={() => {
                setStage(UserSelectStage.TwoFactorAuthentication);
              }}
              color={"tonal"}
            >
              Back
            </UKButton>
            <UKButton
              onClick={() => {
                if (displayName() === "") {
                  setDisplayName(username());
                }

                setStage(UserSelectStage.TermsOfUse);
              }}
              color={"filled"}
            >
              Continue
            </UKButton>
          </div>
        </UKCard>
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
              return () => {
                setStage(UserSelectStage.TwoFactorAuthentication);
              };
            } else {
              // TODO: add an error toast here instead of a console message (When implemented in UIKit of course)
              console.error(resp);
              alert("A critical error occurred!");
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
            {"Would you like to have a guide of Workspaces?"}
          </UKText>
          <UKDivider direction={DividerDirection.horizontal} />
          <div class={styles.continueSegment}>
            <UKButton onClick={() => navigate("/app")} color={"tonal"}>
              Skip guide
            </UKButton>
            <UKButton onClick={() => setStage(UserSelectStage.Guide)} color={"filled"}>
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
