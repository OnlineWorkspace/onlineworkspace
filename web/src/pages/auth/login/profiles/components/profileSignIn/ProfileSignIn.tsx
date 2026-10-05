import {type Component, createSignal, For, Show} from "solid-js";
import {useNavigate, usePreloadRoute} from "@solidjs/router";
import ProfileAvatar from "../profileAvatar/ProfileAvatar.tsx";
import UKButton, {AffirmativeButtonState} from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.tsx";
import UKIconButton from "@ewsgit/uikit-solid/src/components/iconButton/UKIconButton.tsx";
import ARROW_BACK_ICON from "@material-symbols/svg-700/outlined/arrow_back.svg";
import OtpInput from "../../../../../../components/OtpInput/OtpInput.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import UKTextField from "@ewsgit/uikit-solid/src/components/textField/UKTextField.tsx";
import trpc from "../../../../../../lib/trpc.ts";
import styles from "./ProfileSignIn.module.scss";

const ProfileSignIn: Component<{
    username: string, displayName: string, back: () => void
}> = (props) => {
    const navigate = useNavigate();
    const preloadRoute = usePreloadRoute();
    const [password, setPassword] = createSignal("");
    const [showTwoFactor, setShowTwoFactor] = createSignal(false);
    const [failed, setFailed] = createSignal(false);
    const [errorMessage, setErrorMessage] = createSignal<string | undefined>(undefined);
    const [verifying, setVerifying] = createSignal(false);
    const [otpAttempt, setOtpAttempt] = createSignal(0);

    const destination = () => new URLSearchParams(window.location.search).get("redirect") || "/app";

    const signIn = async (twoFactorCode?: string) => {
        const resp = await trpc.authorization.passwordSignin.mutate({
            username: props.username, password: password(), twoFactorCode,
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

    return <UKCard color={"elevated"} class={styles.root}>
        <UKIconButton
            class={styles.back}
            icon={ARROW_BACK_ICON}
            alt={"Not you? Choose another profile"}
            color={"standard"}
            onClick={props.back}
        />
        <ProfileAvatar class={styles.avatar} username={props.username} displayName={props.displayName}/>
        <div class={styles.heading}>
            <UKText role={"headline"} size={"m"} align={"center"}>{props.displayName}</UKText>
            <UKText role={"body"} size={"m"} align={"center"} class={styles.username}>@{props.username}</UKText>
        </div>

        <form class={styles.form} onSubmit={e => e.preventDefault()}>
            <Show
                when={showTwoFactor()}
                fallback={<UKTextField
                    shouldMask={true}
                    color={"outlined"}
                    labelBackgroundColor={"rgb(var(--uk-sys-color-surface-container-low))"}
                    label={"Password"}
                    autocomplete={"current-password"}
                    value={password()}
                    error={failed()}
                    supportingText={failed() ? errorMessage() ?? "Incorrect password" : undefined}
                    onValueChange={value => {
                        setFailed(false);
                        setPassword(value);
                    }}
                />}
            >
                <UKText role={"body"} size={"m"} align={"center"}>
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
                    <UKText role={"body"} size={"s"} align={"center"} class={styles.error}>
                        {errorMessage() ?? "That code was incorrect"}
                    </UKText>
                </Show>
            </Show>
            <div class={styles.actions}>
                <Show when={!showTwoFactor()}>
                    <UKButton
                        color={"standard"}
                        onClick={() => navigate(`/auth/login/forgot-password?username=${props.username}`)}
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
                        color={"filled"}
                        disabled={password() === ""}
                        onClick={() => signIn()}
                        onSuccess={() => {
                        }}
                    >
                        Login
                    </UKButton>
                </Show>
            </div>
        </form>
    </UKCard>
}

export default ProfileSignIn;
