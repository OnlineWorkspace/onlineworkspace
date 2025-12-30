import UKStack from "@tcsw/uikit-solid/src/components/stack/UKStack.tsx";
import { createResource, type Component } from "solid-js";
import styles from "./Index.module.scss";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.tsx";
import trpc from "../../lib/trpc";
import UKAvatar from "@tcsw/uikit-solid/src/components/avatar/UKAvatar.tsx";
import ProfilePicture from "./components/ProfilePicture/ProfilePicture";
import Username from "./components/Username/Username";
import Name from "./components/Name/Name";
import Gender from "./components/Gender/Gender";
import Email from "./components/Email/Email";
import Bio from "./components/Bio/Bio.tsx";
import UKTopAppBar from "@tcsw/uikit-solid/src/components/topAppBar/UKTopAppBar.jsx";
import { useNavigate } from "@solidjs/router";

const ProfilePage: Component = () => {
    const navigate = useNavigate();
    const [name, { refetch: refetchName }] = createResource(() => trpc.profile.getName.query());
    const [role] = createResource(() => trpc.profile.getRole.query());
    const [avatar, { refetch: refetchAvatar }] = createResource(() =>
        trpc.profile.getProfilePicture.query(),
    );

    return (
        <>
            <UKTopAppBar
                type="small"
                headline={"Profile"}
                leadingButton={{
                    icon: "chevron_left",
                    onClick() {
                        navigate("/app/uk.tcsw.settings");
                    },
                    accessibleLabel: "Go back",
                }}
            />
            <div class={styles.root}>
                <div class={styles.header}>
                    <UKAvatar
                        username="username"
                        avatar={
                            avatar()
                                ? `${avatar()}?t=${Date.now()}`
                                : "/assets/placeholder/avatar.png"
                        }
                        size="l"
                    />
                    <div>
                        <UKText role="display" size="l" emphasized class={styles.fullName}>
                            {name() || "Unknown"}
                        </UKText>
                        <UKText role="label" size="l" class={styles.permissionLevel}>
                            {role() || "Unknown"}
                        </UKText>
                    </div>
                </div>
                <UKText class={styles.subheading} role="title" size="m" align="start">
                    Basic info
                </UKText>
                <UKStack>
                    <ProfilePicture refetchAvatar={refetchAvatar} />
                    <Username />
                    <Name refetchName={refetchName} />
                    <Gender />
                    <Bio />
                </UKStack>
                <UKText class={styles.subheading} role="title" size="m" align="start">
                    Contact info
                </UKText>
                <UKStack>
                    <Email />
                </UKStack>
            </div>
        </>
    );
};

export default ProfilePage;
