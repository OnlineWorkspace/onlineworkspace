import UKButton from "@tcsw/uikit-solid/src/components/button/UKButton.jsx";
import UKStackItem from "@tcsw/uikit-solid/src/components/stack/UKStackItem.jsx";
import type { Component } from "solid-js";
import styles from "./ProfilePicture.module.scss";
import { createFileUploader } from "@solid-primitives/upload";
import trpc from "../../../../lib/trpc";

const ProfilePicture: Component = () => {
    const { selectFiles } = createFileUploader({ accept: "image/*", multiple: false });

    return (
        <UKStackItem
            leading={{
                type: "icon",
                value: "photo_camera",
            }}
            labelText="Profile picture"
            supportingText="Help people identify you at a glance"
            expandedComponent={
                <div class={styles.expanded}>
                    <UKButton
                        color="filled"
                        onClick={() => {
                            selectFiles(async ([{ file }]) => {
                                await trpc.profile.setProfilePicture.mutate(file);
                            });
                        }}
                    >
                        Upload new picture
                    </UKButton>
                </div>
            }
        />
    );
};

export default ProfilePicture;
