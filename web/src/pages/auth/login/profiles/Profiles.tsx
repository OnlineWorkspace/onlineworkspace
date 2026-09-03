import {type Component, createEffect, createSignal, For, onMount, Show, useContext} from "solid-js";
import styles from "./Profiles.module.scss";
import {createResource} from "solid-js";
import trpc from "../../../../lib/trpc.js";
import Profile from "./components/profile/Profile.tsx";
import UKIconButton from "@ewsgit/uikit-solid/src/components/iconButton/UKIconButton.tsx";
import PERSON_SEARCH_ICON from "@material-symbols/svg-700/outlined/person_search.svg";
import {useNavigate} from "@solidjs/router";
import AuthContext from "../../authContext.ts";
import PERSON_ADD_ICON from "@material-symbols/svg-700/outlined/person_add.svg";
import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.tsx";

const LoginProfilesPage: Component = () => {
    const authContext = useContext(AuthContext);
    const [profiles] = createResource(() => trpc.userSelect.getProfiles.query())
    const [selected, setSelected] = createSignal<string | undefined>(undefined);
    const navigate = useNavigate();

    let profilesContainer!: HTMLDivElement;

    createEffect(() => {
        const selectedUsername = selected();
        const profileList = profiles();

        if (!profilesContainer || !profileList) return;

        requestAnimationFrame(() => {
            if (selectedUsername === undefined) {
                profilesContainer.style.left = "50%";
                profilesContainer.style.transform = "translate(-50%, 0)";
                return;
            }

            const selectedIndex = profileList.findIndex(profile => profile.username === selectedUsername);

            if (selectedIndex === -1) return;

            const selectedElement = profilesContainer.children[selectedIndex] as HTMLElement | undefined;

            if (!selectedElement) return;

            const selectedCenter = selectedElement.offsetLeft + selectedElement.offsetWidth / 2;

            profilesContainer.style.left = `${window.innerWidth / 2 - selectedCenter}px`;

            profilesContainer.style.transform = "";
        });
    });

    onMount(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "ArrowLeft") {
                setSelected(prevSelected => {
                    if (prevSelected === undefined) return profiles()?.[(profiles()?.length || 0) - 1].username;
                    const prevIndex = profiles()?.findIndex(profile => profile.username === prevSelected) || 0;
                    return profiles()?.[(prevIndex - 1 + (profiles()?.length || 0)) % (profiles()?.length || 0)].username;
                });
            } else if (event.key === "ArrowRight") {
                setSelected(prevSelected => {
                    if (prevSelected === undefined) return profiles()?.[0].username;

                    const prevIndex = profiles()?.findIndex(profile => profile.username === prevSelected) || 0;
                    return profiles()?.[(prevIndex + 1) % (profiles()?.length || 0)].username;
                })
            }
        }

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        }
    })

    return <>
        <div class={styles.contentContainer}>
            <div
                class={styles.profilesContainer}
                style={{
                    "max-width": authContext.showSignup ? "calc(100% - 10.75rem)" : "calc(100% - 2rem)"
                }}
                ref={profilesContainer}
            >
                <For each={profiles()}>
                    {profile => {
                        return <Profile
                            {...profile}
                            anySelected={selected() !== undefined}
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
                <Show when={authContext.showSignup && selected() === undefined}>
                    <UKIconButton
                        class={styles.signupButton}
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

            <Show when={selected() !== undefined}>
                <UKCard>
                    Login Card
                </UKCard>
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
    </>
}

export default LoginProfilesPage;

