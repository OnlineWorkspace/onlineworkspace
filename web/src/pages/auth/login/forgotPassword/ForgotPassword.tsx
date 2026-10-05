import CHEVRON_LEFT_ICON from "@material-symbols/svg-700/outlined/chevron_left.svg";
import UKButton, {AffirmativeButtonState} from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.tsx";
import OtpInput from "../../../../components/OtpInput/OtpInput.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import UKTextField from "@ewsgit/uikit-solid/src/components/textField/UKTextField.tsx";
import {useNavigate, useSearchParams} from "@solidjs/router";
import {type Component, createResource, createSignal, Match, Show, Switch} from "solid-js";
import trpc from "../../../../lib/trpc.ts";
import styles from "./ForgotPassword.module.scss";

type Stage = "request" | "reset" | "done" | "emailDisabled";

const ForgotPassword: Component = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [stage, setStage] = createSignal<Stage>("request");
    const [username, setUsername] = createSignal(searchParams.username?.toString() || "");
    const [code, setCode] = createSignal("");
    const [password, setPassword] = createSignal("");
    const [confirmPassword, setConfirmPassword] = createSignal("");
    const [twoFactorCode, setTwoFactorCode] = createSignal("");
    const [needsTwoFactor, setNeedsTwoFactor] = createSignal(false);
    const [error, setError] = createSignal<string | undefined>(undefined);
    const [requirements] = createResource(() => trpc.userSelect.signupRequirements.query());

    const goToLogin = () => navigate(`/auth/login?username=${encodeURIComponent(username())}`);

    const passwordsMismatch = () => confirmPassword() !== "" && password() !== confirmPassword();
    const canSubmit = () => code().trim() !== "" && password() !== "" && password() === confirmPassword()
        && (!needsTwoFactor() || twoFactorCode().length === 6);

    return <div class={styles.root}>
        <UKCard color={"filled"} class={styles.card}>
            <Switch>
                <Match when={stage() === "request"}>
                    <UKText role={"title"} size={"l"} emphasized={true}>Reset your password</UKText>
                    <UKText role={"body"} size={"m"}>
                        We'll email a reset code to the address linked to your account.
                    </UKText>
                    <UKTextField
                        color={"outlined"}
                        label={"Username"}
                        value={username()}
                        onValueChange={setUsername}
                        autocomplete={"username"}
                    />
                </Match>
                <Match when={stage() === "reset"}>
                    <UKText role={"title"} size={"l"} emphasized={true}>Choose a new password</UKText>
                    <UKText role={"body"} size={"m"}>
                        If an account with a linked email exists for {username()}, a code has been sent to it.
                    </UKText>
                    <UKTextField color={"outlined"} label={"Reset code"} value={code()} onValueChange={setCode}
                                 autocomplete={"one-time-code"}/>
                    <UKTextField
                        shouldMask={true}
                        color={"outlined"}
                        label={"New password"}
                        value={password()}
                        onValueChange={setPassword}
                        autocomplete={"new-password"}
                        supportingText={requirements()?.passwordMinimumLength !== undefined
                            ? `At least ${requirements()!.passwordMinimumLength} characters` : undefined}
                    />
                    <UKTextField
                        shouldMask={true}
                        color={"outlined"}
                        label={"Confirm new password"}
                        value={confirmPassword()}
                        onValueChange={setConfirmPassword}
                        autocomplete={"new-password"}
                        error={passwordsMismatch()}
                        supportingText={passwordsMismatch() ? "Passwords do not match" : undefined}
                    />
                    <Show when={needsTwoFactor()}>
                        <UKText role={"body"} size={"m"} align={"center"}>Authenticator code</UKText>
                        <OtpInput onChange={setTwoFactorCode} onComplete={setTwoFactorCode}/>
                    </Show>
                </Match>
                <Match when={stage() === "done"}>
                    <UKText role={"title"} size={"l"} emphasized={true}>Password changed</UKText>
                    <UKText role={"body"} size={"m"}>
                        Your password has been updated and all your other sessions were signed out.
                    </UKText>
                </Match>
                <Match when={stage() === "emailDisabled"}>
                    <UKText role={"title"} size={"l"} emphasized={true}>Reset unavailable</UKText>
                    <UKText role={"body"} size={"m"}>
                        This instance can't send emails, so passwords can't be reset here. Please ask an
                        administrator to reset it for you.
                    </UKText>
                </Match>
            </Switch>
            <Show when={error()}>
                <UKText role={"body"} size={"m"} class={styles.error}>{error()}</UKText>
            </Show>
        </UKCard>

        <div class={styles.actions}>
            <UKButton
                onClick={stage() === "reset" ? () => {
                    setError(undefined);
                    setStage("request");
                } : goToLogin}
                color="tonal"
                leadingIcon={CHEVRON_LEFT_ICON}
            >
                {stage() === "done" || stage() === "emailDisabled" ? "Back to login" : "Go back"}
            </UKButton>
            <Switch>
                <Match when={stage() === "request"}>
                    <UKButton
                        affirmative
                        disabled={username().trim() === ""}
                        onClick={async () => {
                            setError(undefined);
                            try {
                                const {emailEnabled} = await trpc.authorization.passwordResetRequest.mutate({username: username().trim()});
                                setStage(emailEnabled ? "reset" : "emailDisabled");
                                return {state: AffirmativeButtonState.Unset};
                            } catch {
                                setError("Something went wrong, please try again");
                                return {state: AffirmativeButtonState.Error};
                            }
                        }}
                    >
                        Send code
                    </UKButton>
                </Match>
                <Match when={stage() === "reset"}>
                    <UKButton
                        affirmative
                        disabled={!canSubmit()}
                        onClick={async () => {
                            setError(undefined);
                            try {
                                const resp = await trpc.authorization.passwordResetComplete.mutate({
                                    username: username().trim(),
                                    code: code(),
                                    newPassword: password(),
                                    twoFactorCode: needsTwoFactor() ? twoFactorCode() : undefined,
                                });

                                if (resp.type === "requirementsNotMet") {
                                    setNeedsTwoFactor(true);
                                    setError("Enter the code from your authenticator app to continue");
                                    return {state: AffirmativeButtonState.Unset};
                                }

                                if (resp.type === "error") {
                                    setError(resp.message);
                                    return {state: AffirmativeButtonState.Error};
                                }

                                setStage("done");
                                return {state: AffirmativeButtonState.Unset};
                            } catch {
                                setError("Something went wrong, please try again");
                                return {state: AffirmativeButtonState.Error};
                            }
                        }}
                    >
                        Reset password
                    </UKButton>
                </Match>
                <Match when={stage() === "done"}>
                    <UKButton color={"filled"} onClick={goToLogin}>Login</UKButton>
                </Match>
            </Switch>
        </div>
    </div>;
};

export default ForgotPassword;
