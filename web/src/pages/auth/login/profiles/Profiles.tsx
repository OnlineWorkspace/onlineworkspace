import {type Component, createResource, createSignal, For, Match, Show, Switch, useContext} from "solid-js";
import styles from "./Profiles.module.scss";
import trpc from "../../../../lib/trpc.js";
import Profile from "./components/profile/Profile.tsx";
import ProfileSignIn from "./components/profileSignIn/ProfileSignIn.tsx";
import UKIconButton from "@ewsgit/uikit-solid/src/components/iconButton/UKIconButton.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import PERSON_SEARCH_ICON from "@material-symbols/svg-700/outlined/person_search.svg";

import {useNavigate} from "@solidjs/router";
import AuthContext from "../../authContext.ts";

const LoginProfilesPage: Component = () => {
    const authContext = useContext(AuthContext);
    const [profiles] = createResource(() => trpc.userSelect.getProfiles.query());
    const [selected, setSelected] = createSignal<{ username: string, displayName: string } | undefined>(undefined);
    const navigate = useNavigate();

    return <>
        <div class={styles.contentContainer}>
            <Switch>
                <Match when={selected()}>
                    {profile => <ProfileSignIn
                        username={profile().username}
                        displayName={profile().displayName}
                        back={() => setSelected(undefined)}
                    />}
                </Match>
                <Match when={true}>
                    <UKText role={"display"} size={"l"} align={"center"} class={styles.heading}>
                        Who is signing in?
                    </UKText>
                    <div class={styles.profilesGrid} role={"list"}>
                        <For each={profiles()}>
                            {profile => <Profile {...profile} select={() => setSelected(profile)}/>}
                        </For>
                        <Show when={authContext.showSignup}>
                            <Profile add={true} select={() => navigate("/auth/signup")}/>
                        </Show>
                    </div>
                </Match>
            </Switch>
        </div>

        <UKIconButton
            class={styles.switchToStandardView}
            icon={PERSON_SEARCH_ICON}
            color={"standard"}
            alt={"Enter username manually"}
            onClick={() => navigate("/auth/login/standard")}
        />
    </>
}

export default LoginProfilesPage;
