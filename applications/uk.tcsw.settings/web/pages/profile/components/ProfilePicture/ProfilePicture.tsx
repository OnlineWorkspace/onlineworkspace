import UKStackItem from "@tcsw/uikit-solid/src/components/stack/UKStackItem.jsx";
import { type Component } from "solid-js";
import styles from "./ProfilePicture.module.scss";
import CropImage from "./components/CropImage/CropImage.tsx";

const ProfilePicture: Component<{ refetchAvatar(): void }> = (props) => {
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
                    <CropImage refetchAvatar={props.refetchAvatar} />
                </div>
            }
        />
    );
};

export default ProfilePicture;
