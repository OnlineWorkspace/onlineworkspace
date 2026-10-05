import UKButton, {AffirmativeButtonState} from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.tsx";
import UKDivider from "@ewsgit/uikit-solid/src/components/divider/UKDivider.tsx";
import {DividerDirection} from "@ewsgit/uikit-solid/src/components/divider/lib/direction.ts";
import PERSON_ICON from "@material-symbols/svg-700/outlined/person.svg";
import LOCK_ICON from "@material-symbols/svg-700/outlined/lock.svg";
import OtpInput from "../../../../components/OtpInput/OtpInput.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import UKTextField from "@ewsgit/uikit-solid/src/components/textField/UKTextField.tsx";
import {startAuthentication} from "@simplewebauthn/browser";
import {useNavigate, usePreloadRoute, useSearchParams} from "@solidjs/router";
import {type Component, createEffect, createSignal, For, Show, useContext} from "solid-js";
import trpc from "../../../../lib/trpc";
import styles from "./Standard.module.scss";
import AuthContext from "../../authContext.ts";

const LoginStandardPage: Component = () => {
    const navigate = useNavigate();
    const preloadRoute = usePreloadRoute();
    const options = useContext(AuthContext)
    const [searchParams] = useSearchParams();

    const [username, setUsername] = createSignal(searchParams.username as string | undefined || "");
    const [password, setPassword] = createSignal("");
    const [showTwoFactor, setShowTwoFactor] = createSignal<boolean>(false);
    const [failed, setFailed] = createSignal(false);
    const [errorMessage, setErrorMessage] = createSignal<string | undefined>(undefined);
    const [verifying, setVerifying] = createSignal(false);
    const [otpAttempt, setOtpAttempt] = createSignal(0);

    const destination = () => new URLSearchParams(window.location.search).get("redirect") || "/app";

    const signIn = async (twoFactorCode?: string) => {
        const resp = await trpc.authorization.passwordSignin.mutate({
            username: username(), password: password(), twoFactorCode,
        });

        if (resp.type === "requirementsNotMet") {
            if (resp.requireAny.includes("totp")) setShowTwoFactor(true);

            return {state: AffirmativeButtonState.Unset};
        }

        if (resp.type === "success") {
            preloadRoute(destination());

            return {state: AffirmativeButtonState.Success, cb: () => navigate(destination())};
        }

        setFailed(true);
        setErrorMessage(resp.message);
        return {state: AffirmativeButtonState.Error};
    };

    createEffect(async () => {
        if (username() === "") return;

        const authenticationOptions = await trpc.authorization.passkeyRequestSignIn.query({username: username()});

        if (authenticationOptions === undefined || authenticationOptions === false) return;

        const authenticationResponse = await startAuthentication({
            optionsJSON: authenticationOptions, useBrowserAutofill: true,
        });

        const response = await trpc.authorization.passkeyCompleteSignIn.mutate({
            username: username(), passkeyResponse: authenticationResponse
        });

        if (response.type === "success") {
            navigate(destination());
        }
    });

    return (<UKCard color={"elevated"} class={styles.modal}>
        <div class={styles.heading}>
            <UKText role={"headline"} size={"m"} align={"center"}>
                Welcome back
            </UKText>
            <UKText role={"body"} size={"m"} align={"center"} class={styles.subtitle}>
                Sign in to {options.displayName}
            </UKText>
        </div>

        <form class={styles.form} onSubmit={e => e.preventDefault()}>
            <Show
                when={showTwoFactor()}
                fallback={<>
                    <UKTextField
                        color={"outlined"}
                        labelBackgroundColor={"rgb(var(--uk-sys-color-surface-container-low))"}
                        label={"Username"}
                        leadingIcon={{icon: PERSON_ICON}}
                        defaultValue={searchParams.username?.toString() || ""}
                        value={username()}
                        onValueChange={value => {
                            setFailed(false);
                            setUsername(value);
                        }}
                        autocomplete="username webauthn"
                    />
                    <UKTextField
                        shouldMask={true}
                        color={"outlined"}
                        labelBackgroundColor={"rgb(var(--uk-sys-color-surface-container-low))"}
                        label={"Password"}
                        leadingIcon={{icon: LOCK_ICON}}
                        autocomplete="current-password webauthn"
                        value={password()}
                        error={failed()}
                        supportingText={failed() ? errorMessage() ?? "Incorrect username or password" : undefined}
                        onValueChange={value => {
                            setFailed(false);
                            setPassword(value);
                        }}
                    />
                </>}
            >
                <UKText size={"m"} role={"body"} align={"center"}>
                    Enter the 6-digit code from your authenticator app.
                </UKText>
                <For each={[otpAttempt()]}>
                    {() => <OtpInput
                        error={failed()}
                        disabled={verifying()}
                        onChange={() => setFailed(false)}
                        onComplete={async (code) => {
                            setVerifying(true);
                            try {
                                const result = await signIn(code);
                                if (result.state === AffirmativeButtonState.Success) {
                                    result.cb?.();
                                } else if (result.state === AffirmativeButtonState.Error) {
                                    setOtpAttempt(attempt => attempt + 1);
                                }
                            } finally {
                                setVerifying(false);
                            }
                        }}
                    />}
                </For>
                <Show when={failed()}>
                    <UKText size={"s"} role={"body"} align={"center"} class={styles.error}>
                        {errorMessage() ?? "That code was incorrect"}
                    </UKText>
                </Show>
            </Show>
            <div class={styles.actions}>
                <Show when={!showTwoFactor()}>
                    <UKButton
                        onClick={() => navigate(`/auth/login/forgot-password?username=${encodeURIComponent(username())}`)}
                        color={"standard"}
                    >
                        Reset password
                    </UKButton>
                </Show>
                <Show when={showTwoFactor()}>
                    <UKButton
                        color={"standard"}
                        onClick={() => {
                            setShowTwoFactor(false);
                            setFailed(false);
                            setErrorMessage(undefined);
                        }}
                    >
                        Back
                    </UKButton>
                </Show>
                <Show when={!showTwoFactor()}>
                    <UKButton
                        affirmative={true}
                        disabled={username() === "" || password() === ""}
                        onClick={() => signIn()}
                        onSuccess={() => {
                        }}
                        color={"filled"}
                    >
                        Login
                    </UKButton>
                </Show>
            </div>
        </form>

        <Show when={options.showSignup && !showTwoFactor()}>
            <UKDivider direction={DividerDirection.horizontal}/>
            <div class={styles.signupSegment}>
                <UKText role={"body"} size={"m"}>
                    Don't have an account?
                </UKText>
                <UKButton onClick={() => navigate("/auth/signup")} color={"tonal"}>
                    Sign up
                </UKButton>
            </div>
        </Show>
    </UKCard>);
};

export default LoginStandardPage;
