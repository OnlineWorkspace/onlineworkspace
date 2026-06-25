import REFRESH_ICON from "@material-symbols/svg-700/outlined/refresh.svg";
import UPLOAD_ICON from "@material-symbols/svg-700/outlined/upload.svg";
import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKStackItem from "@ewsgit/uikit-solid/src/components/stack/UKStackItem.tsx";
import type { Component } from "solid-js";
import brandingStyles from "../../index.module.scss";
import UKIconButton from "@ewsgit/uikit-solid/src/components/iconButton/UKIconButton.tsx";

const LoginBackground: Component = () => {
  return (
    <UKStackItem
      labelText="Login Background"
      supportingText="Recommended size: 2560x1440px. This is displayed as the background of the user login page."
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

export default LoginBackground;
