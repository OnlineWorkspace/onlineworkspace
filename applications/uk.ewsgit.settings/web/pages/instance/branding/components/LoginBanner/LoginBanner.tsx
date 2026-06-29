import UKStackItem from "@ewsgit/uikit-solid/src/components/stack/UKStackItem.tsx";
import type { Component } from "solid-js";
import ImageUploadAndPreview from "../ImageUploadAndPreview/ImageUploadAndPreview.tsx";

const LoginBanner: Component = () => {
  return (
    <UKStackItem
      labelText="Login Banner"
      supportingText="Recommended size: 1200x400px. This is displayed above the user login form."
      expandedComponent={<ImageUploadAndPreview trpcSegment={"loginBanner"}/>}
    />
  );
};

export default LoginBanner;
