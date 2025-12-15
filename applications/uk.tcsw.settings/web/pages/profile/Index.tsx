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

const ProfilePage: Component = () => {
    const [name] = createResource(() => trpc.profile.getName.query());
    const [role] = createResource(() => trpc.profile.getRole.query());
    const [avatar] = createResource(() => trpc.profile.getProfilePicture.query());

    return (
        <div class={styles.root}>
            <div class={styles.header}>
                <UKAvatar username="username" avatar={avatar() || "/assets/placeholder/avatar.png"} size="l" />
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
                <ProfilePicture />
                <Username />
                <Name />
                <Gender />
                <Bio/>
            </UKStack>
            <UKText class={styles.subheading} role="title" size="m" align="start">
                Contact info
            </UKText>
            <UKStack>
                <Email />
            </UKStack>
        </div>
    );
};

export default ProfilePage;
