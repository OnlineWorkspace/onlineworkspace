import REFRESH_ICON from "@material-symbols/svg-700/outlined/refresh.svg";
import UPLOAD_ICON from "@material-symbols/svg-700/outlined/upload.svg";
import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKStackItem from "@ewsgit/uikit-solid/src/components/stack/UKStackItem.tsx";
import type { Component } from "solid-js";
import brandingStyles from "../../Branding.module.scss";
import UKIconButton from "@ewsgit/uikit-solid/src/components/iconButton/UKIconButton.tsx";

const Favicon: Component = () => {
  return (
    <UKStackItem
      labelText="Favicon"
      supportingText="Recommended size: 32x32px. This is displayed in the browser tab and bookmarks."
      inlineComponent={
        <>
          <UKButton class={brandingStyles.uploadButton} leadingIcon={UPLOAD_ICON} disabled onClick={() => {}} color="filled">
            Upload
          </UKButton>
          <UKIconButton disabled alt="Reset" icon={REFRESH_ICON} onClick={() => 0} color="standard" />
        </>
      }
    />
  );
};

export default Favicon;
