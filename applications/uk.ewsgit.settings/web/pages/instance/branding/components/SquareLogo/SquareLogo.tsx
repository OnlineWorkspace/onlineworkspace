import UKStackItem from "@ewsgit/uikit-solid/src/components/stack/UKStackItem.tsx";
import type { Component } from "solid-js";
import ImageUploadAndPreview from "../ImageUploadAndPreview/ImageUploadAndPreview.tsx";

const SquareLogo: Component = () => {
  return (
    <UKStackItem
      labelText="Square Logo"
      supportingText="Recommended size: 128x128px. This can be displayed in the app navigation rail."
      expandedComponent={<ImageUploadAndPreview trpcSegment={"squareLogo"}/>}
    />
  );
};

export default SquareLogo;
