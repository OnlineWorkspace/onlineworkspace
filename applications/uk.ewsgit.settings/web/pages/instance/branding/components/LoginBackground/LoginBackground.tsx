import UKStackItem from "@ewsgit/uikit-solid/src/components/stack/UKStackItem.tsx";
import type { Component } from "solid-js";
import ImageUploadAndPreview from "../ImageUploadAndPreview/ImageUploadAndPreview.tsx";

const LoginBackground: Component = () => {
  return (
    <UKStackItem
      labelText="Login Background"
      supportingText="Recommended size: 2560x1440px. This is displayed as the background of the user login page."
      expandedComponent={<ImageUploadAndPreview trpcSegment={"loginBackground"}/>}
    />
  );
};

export default LoginBackground;
