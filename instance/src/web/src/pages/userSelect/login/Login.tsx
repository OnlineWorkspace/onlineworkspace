import { type Component, createEffect, createResource, createSignal } from "solid-js";
import UKCard from "@tcsw/uikit-solid/src/components/card/UKCard.tsx";
import UKButton from "@tcsw/uikit-solid/src/components/button/UKButton.tsx";
import UKDivider from "@tcsw/uikit-solid/src/components/divider/UKDivider.tsx";
import { DividerDirection } from "@tcsw/uikit-solid/src/components/divider/lib/direction.ts";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.tsx";
import styles from "./Login.module.scss";
import UKTextField from "@tcsw/uikit-solid/src/components/textField/UKTextField.tsx";
import { useNavigate } from "@solidjs/router";
import trpc from "../../../lib/trpc";

const UserSelectPage: Component = () => {
    const navigate = useNavigate();

    const [username, setUsername] = createSignal("");
    const [password, setPassword] = createSignal("");
    const [showTwoFactor, setShowTwoFactor] = createSignal<boolean>(false);
    const [canSignup] = createResource(() => trpc.authorization.canSignup.query());

    createEffect(async () => {
        if ((await trpc.authorization.isAuthenticated.query()).authenticated) {
            window.location.href = "/app";
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
                                let resp = await trpc.authorization.signin.mutate({
                                    username: username(),
                                    password: password(),
                                    twoFactorCode: val,
                                });

                                if (resp.type === "success") {
                                    window.location.href = "/app";
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
                            getValue={setUsername}
                            autocomplete="username"
                        />
                        <UKTextField
                            shouldMask={true}
                            color={"outlined"}
                            label={"Password"}
                            autocomplete="password"
                            getValue={setPassword}
                        />
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
                                        window.location.href = "/app";
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
                        leadingIcon={"key"}
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
