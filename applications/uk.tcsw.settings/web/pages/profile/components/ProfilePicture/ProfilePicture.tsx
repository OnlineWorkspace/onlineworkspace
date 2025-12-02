import UKButton from "@tcsw/uikit-solid/src/components/button/UKButton.jsx";
import UKStackItem from "@tcsw/uikit-solid/src/components/stack/UKStackItem.jsx";
import type { Component } from "solid-js";

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
                <UKButton color="filled" onClick={() => 0}>
                    Upload new picture
                </UKButton>
            }
        />
    );
};

export default ProfilePicture;
