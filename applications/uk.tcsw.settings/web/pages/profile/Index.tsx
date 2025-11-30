import UKStack from "@tcsw/uikit-solid/src/components/stack/UKStack.jsx";
import UKStackItem from "@tcsw/uikit-solid/src/components/stack/UKStackItem.jsx";
import { createResource, type Component } from "solid-js";
import styles from "./Index.module.scss";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.jsx";
import trpc from "../../lib/trpc";
import UKAvatar from "@tcsw/uikit-solid/src/components/avatar/UKAvatar.jsx";

const ProfilePage: Component = () => {
    const [name, { mutate: setName }] = createResource(() => trpc.profile.name.query());
    const [gender, { mutate: setGender }] = createResource(() => trpc.profile.gender.query());
    const [email, { mutate: setEmail }] = createResource(() => trpc.profile.email.query());
    const [role] = createResource(() => trpc.profile.role.query());

    return (
        <div class={styles.root}>
            <div class={styles.header}>
                <UKAvatar username="username" avatar="/assets/placeholder/avatar.png" size="l" />
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
                <UKStackItem
                    leading={{
                        type: "icon",
                        value: "photo_camera",
                    }}
                    labelText="Profile picture"
                    supportingText="Help people identify you at a glance"
                    onClick={() => {
                        return 0;
                    }}
                />
                <UKStackItem
                    leading={{
                        type: "icon",
                        value: "assignment_ind",
                    }}
                    labelText="Name"
                    supportingText={name()}
                    onClick={() => {
                        return 0;
                    }}
                />
                <UKStackItem
                    leading={{
                        type: "icon",
                        value: "person",
                    }}
                    labelText="Gender"
                    supportingText={gender()}
                    onClick={() => {
                        return 0;
                    }}
                />
            </UKStack>
            <UKText class={styles.subheading} role="title" size="m" align="start">
                Contact info
            </UKText>
            <UKStack>
                <UKStackItem
                    leading={{
                        type: "icon",
                        value: "email",
                    }}
                    labelText="Email"
                    supportingText={email()}
                    onClick={() => {
                        return 0;
                    }}
                />
            </UKStack>
        </div>
    );
};

export default ProfilePage;
