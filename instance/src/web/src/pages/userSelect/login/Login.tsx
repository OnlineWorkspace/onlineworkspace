import KEY_ICON from "@material-symbols/svg-700/outlined/key.svg";
import { useNavigate } from "@solidjs/router";
import UKButton from "@tcsw/uikit-solid/src/components/button/UKButton.tsx";
import UKCard from "@tcsw/uikit-solid/src/components/card/UKCard.tsx";
import { DividerDirection } from "@tcsw/uikit-solid/src/components/divider/lib/direction.ts";
import UKDivider from "@tcsw/uikit-solid/src/components/divider/UKDivider.tsx";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.tsx";
import UKTextField from "@tcsw/uikit-solid/src/components/textField/UKTextField.tsx";
import { type Component, createEffect, createResource, createSignal } from "solid-js";
import trpc from "../../../lib/trpc";
import styles from "./Login.module.scss";

const UserSelectPage: Component = () => {
  const navigate = useNavigate();

  const [username, setUsername] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [showTwoFactor, setShowTwoFactor] = createSignal<boolean>(false);
  const [canSignup] = createResource(() => trpc.authorization.canSignup.query());

  createEffect(async () => {
    if ((await trpc.authorization.isAuthenticated.query()).authenticated) {
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
            getValue={async (val) => {
              if (val.length === 6) {
                const resp = await trpc.authorization.signin.mutate({
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
            <UKTextField color={"outlined"} label={"Username"} setValue={username()} getValue={setUsername} autocomplete="username" />
            <UKTextField shouldMask={true} color={"outlined"} label={"Password"} autocomplete="password" setValue={password()} getValue={setPassword} />
            <div class={styles.loginButtons}>
              <UKButton onClick={() => 0} disabled={username() === ""} color={"standard"}>
                Forgot password?
              </UKButton>
              <UKButton
                disabled={username() === "" || password() === ""}
                onClick={async () => {
                  const resp = await trpc.authorization.signin.mutate({
                    username: username(),
                    password: password(),
                  });

                  if (resp.type === "twofactor") {
                    setShowTwoFactor(true);
                    return;
                  }

                  if (resp.type === "success") {
                    const redirect = new URLSearchParams(window.location.search).get("redirect");
                    if (redirect) {
                      navigate(redirect);
                      return;
                    }

                    navigate("/app");
                    return;
                  }

                  // TODO: change to a toast when support is included in UIKit
                  console.error("Failed to login");
                }}
                color={"filled"}
              >
                Login
              </UKButton>
            </div>
          </form>
          <UKDivider direction={DividerDirection.horizontal} />
          {/* TODO: implement security key as a login method */}
          <UKButton
            class={styles.alternateLoginMethod}
            leadingIcon={KEY_ICON}
            color={"tonal"}
            disabled={true}
            onClick={() => {
              return 0;
            }}
          >
            Use Security Key
          </UKButton>
          {canSignup() ? (
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
