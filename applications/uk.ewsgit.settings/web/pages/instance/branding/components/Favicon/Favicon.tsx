import UKStackItem from "@ewsgit/uikit-solid/src/components/stack/UKStackItem.tsx";
import type { Component } from "solid-js";
import ImageUploadAndPreview from "../ImageUploadAndPreview/ImageUploadAndPreview.tsx";

const Favicon: Component = () => {
  return (
    <UKStackItem
      labelText="Favicon"
      supportingText="Recommended size: 32x32px. This is displayed in the browser tab and bookmarks."
      expandedComponent={<ImageUploadAndPreview trpcSegment={"favicon"}/>}
    />
  );
};

export default Favicon;
