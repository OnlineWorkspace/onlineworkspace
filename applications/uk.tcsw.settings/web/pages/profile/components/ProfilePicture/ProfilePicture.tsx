import UKStackItem from "@tcsw/uikit-solid/src/components/stack/UKStackItem.jsx";
import { type Component } from "solid-js";
import styles from "./ProfilePicture.module.scss";
import CropImage from "./components/CropImage/CropImage.tsx";

const ProfilePicture: Component = () => {

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
                    <CropImage />
                </div>
            }
        />
    );
};

export default ProfilePicture;
