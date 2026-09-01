import {type Component, createSignal, For, Show, useContext} from "solid-js";
import styles from "./Profiles.module.scss";
import {createResource} from "solid-js";
import trpc from "../../../../lib/trpc.js";
import Profile from "./components/profile/Profile.tsx";
import UKIconButton from "@ewsgit/uikit-solid/src/components/iconButton/UKIconButton.tsx";
import PERSON_SEARCH_ICON from "@material-symbols/svg-700/outlined/person_search.svg";
import {useNavigate} from "@solidjs/router";
import AuthContext from "../../authContext.ts";
import PERSON_ADD_ICON from "@material-symbols/svg-700/outlined/person_add.svg";

const LoginProfilesPage: Component = () => {
    const authContext = useContext(AuthContext);
    const [profiles] = createResource(() => trpc.userSelect.getProfiles.query())
    const [selected, setSelected] = createSignal<string | undefined>(undefined);
    const navigate = useNavigate();

    return <div class={styles.root}>
        <div class={styles.profilesContainer}>
            <For each={profiles()}>
                {profile => {
                    return <Profile
                        {...profile}
                        selected={selected() === profile.username}
                        select={() => {
                            if (selected() === profile.username) {
                                setSelected(undefined)
                            } else {
                                setSelected(profile.username)
                            }
                        }}
                    />
                }}
            </For>
            <Show when={authContext.showSignup}>
                <UKIconButton
                    icon={PERSON_ADD_ICON}
                    alt={"signup"}
                    size={"xl"}
                    color={"standard"}
                    onClick={() => {
                        navigate("/auth/signup")
                    }}
                />
            </Show>
        </div>

        <UKIconButton
            class={styles.switchToStandardView}
            icon={PERSON_SEARCH_ICON}
            color={"standard"}
            alt={"Enter username manually"}
            onClick={() => {
                navigate("/auth/login/standard")
            }}
        />
    </div>
}

export default LoginProfilesPage;

