import UKButton, { AffirmativeButtonState } from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.tsx";
import { DividerDirection } from "@ewsgit/uikit-solid/src/components/divider/lib/direction.ts";
import UKDivider from "@ewsgit/uikit-solid/src/components/divider/UKDivider.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import UKTextField from "@ewsgit/uikit-solid/src/components/textField/UKTextField.tsx";
import { startAuthentication } from "@simplewebauthn/browser";
import { useNavigate, usePreloadRoute, useSearchParams } from "@solidjs/router";
import {type Component, createEffect, createSignal, onMount, useContext} from "solid-js";
import trpc from "../../../lib/trpc";
import styles from "./Login.module.scss";
import UserSelectContext from "../userSelectContext.ts";

const UserSelectPage: Component = () => {
  const navigate = useNavigate();
  const preloadRoute = usePreloadRoute();
  const options = useContext(UserSelectContext)
  const [searchParams] = useSearchParams();

  const [username, setUsername] = createSignal(searchParams.username as string | undefined || "");
  const [password, setPassword] = createSignal("");
  const [showTwoFactor, setShowTwoFactor] = createSignal<boolean>(false);

  onMount(async () => {
    if ((await trpc.authorization.isAuthenticated.query()).authenticated) {
      navigate("/app");
    }
  });

  createEffect(async () => {
    if (username() === "") return;

    const authenticationOptions = await trpc.authorization.passkeyRequestSignIn.query({ username: username() });

    if (authenticationOptions === undefined) return;

    const authenticationResponse = await startAuthentication({
      optionsJSON: authenticationOptions,
      useBrowserAutofill: true,
    });

    const response = await trpc.authorization.passkeyCompleteSignIn.mutate({ username: username(), passkeyResponse: authenticationResponse });

    if (response.type === "success") {
      const redirect = new URLSearchParams(window.location.search).get("redirect");
      if (redirect) {
        navigate(redirect);
      }

      navigate("/app");
    }
  });

  return (
    <UKCard color={"filled"} class={styles.modal}>
      <UKText role={"title"} size={"l"} emphasized={true}>
        Sign In
      </UKText>
      <UKDivider direction={DividerDirection.horizontal} />
      {showTwoFactor() ? (
        <>
          <UKText size={"m"} role={"body"}>
            Please enter the 2FA code from your authenticator app.
          </UKText>
          <UKTextField
            color={"outlined"}
            onValueChange={async (val) => {
              if (val.length === 6) {
                const resp = await trpc.authorization.passwordSignin.mutate({
                  username: username(),
                  password: password(),
                  twoFactorCode: val,
                });

                if (resp.type === "success") {
                  const redirect = new URLSearchParams(window.location.search).get("redirect");
                  if (redirect) {
                    navigate(redirect);
                    return;
                  }

                  navigate("/app");
                }
              }
            }}
            label={"Two Factor Code"}
          />
        </>
      ) : (
        <>
          <form>
            <UKTextField
              color={"outlined"}
              label={"Username"}
              defaultValue={searchParams.username?.toString() || ""}
              value={username()}
              onValueChange={setUsername}
              autocomplete="username webauthn"
            />
            <UKTextField
              shouldMask={true}
              color={"outlined"}
              label={"Password"}
              autocomplete="password webauthn"
              value={password()}
              onValueChange={setPassword}
            />
            <div class={styles.loginButtons}>
              <UKButton onClick={() => navigate(`/forgot-password?username=${username()}`)} disabled={username() === ""} color={"standard"}>
                Forgot password?
              </UKButton>
              <UKButton
                affirmative={true}
                disabled={username() === "" || password() === ""}
                onClick={async () => {
                  const resp = await trpc.authorization.passwordSignin.mutate({
                    username: username(),
                    password: password(),
                  });

                  if (resp.type === "requirementsNotMet") {
                    if (resp.requireAny.includes("totp"))
                      setShowTwoFactor(true);

                    return { state: AffirmativeButtonState.Unset };
                  }

                  if (resp.type === "success") {
                    const redirect = new URLSearchParams(window.location.search).get("redirect");
                    if (redirect) {
                      preloadRoute(redirect);
                      return { state: AffirmativeButtonState.Success, cb: () => navigate(redirect) };
                    }

                    preloadRoute("/app");
                    return {
                      state: AffirmativeButtonState.Success,
                      cb: () => navigate("/app"),
                    };
                  }

                  // TODO: change to a toast when support is included in UIKit
                  console.error("Failed to login");
                  return { state: AffirmativeButtonState.Error };
                }}
                onSuccess={() => { }}
                color={"filled"}
              >
                Login
              </UKButton>
            </div>
          </form>
          {options.showSignup ? (
            <>
              <UKDivider direction={DividerDirection.horizontal} />
              <div class={styles.signupSegment}>
                <UKText role={"body"} size={"m"}>
                  Don't have an account?
                </UKText>
                <UKButton onClick={() => navigate("/signup")} color={"tonal"}>
                  Signup
                </UKButton>
              </div>
            </>
          ) : null}
        </>
      )}
    </UKCard>
  );
};

export default UserSelectPage;
