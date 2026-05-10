import REFRESH_ICON from "@material-symbols/svg-700/outlined/refresh.svg";
import UPLOAD_ICON from "@material-symbols/svg-700/outlined/upload.svg";
import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.jsx";
import UKStackItem from "@ewsgit/uikit-solid/src/components/stack/UKStackItem.jsx";
import type { Component } from "solid-js";
import brandingStyles from "../../Branding.module.scss";
import UKIconButton from "@ewsgit/uikit-solid/src/components/iconButton/UKIconButton.jsx";

const SquareLogo: Component = () => {
  return (
    <UKStackItem
      labelText="Square Logo"
      supportingText="Recommended size: 128x128px. This is displayed in the app navigation rail."
      inlineComponent={
        <>
          <UKButton class={brandingStyles.uploadButton} leadingIcon={UPLOAD_ICON} disabled onClick={() => { }} color="filled">
            Upload
          </UKButton>
          <UKIconButton disabled alt="Reset" icon={REFRESH_ICON} onClick={() => 0} color="standard" />
        </>
      }
    />
  );
};

export default SquareLogo;
