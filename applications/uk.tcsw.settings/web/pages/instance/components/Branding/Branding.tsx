import REFRESH_ICON from "@material-symbols/svg-700/outlined/refresh.svg";
import UPLOAD_ICON from "@material-symbols/svg-700/outlined/upload.svg";
import UKButton from "@tcsw/uikit-solid/src/components/button/UKButton.jsx";
import UKIconButton from "@tcsw/uikit-solid/src/components/iconButton/UKIconButton.jsx";
import UKStack from "@tcsw/uikit-solid/src/components/stack/UKStack.jsx";
import UKStackItem from "@tcsw/uikit-solid/src/components/stack/UKStackItem.jsx";
import UKStackLabel from "@tcsw/uikit-solid/src/components/stack/UKStackLabel.jsx";
import UKTextField from "@tcsw/uikit-solid/src/components/textField/UKTextField.jsx";
import type { Component } from "solid-js";
import styles from "./Branding.module.scss";

const Branding: Component = () => {
  return (
    <>
      <UKStackLabel>Branding</UKStackLabel>
      <UKStack>
        <UKStackItem
          labelText="Login Banner"
          supportingText="Recommended size: 1200x400px. This is displayed above the user login form."
          inlineComponent={
            <>
              <UKButton
                class={styles.uploadButton}
                leadingIcon={UPLOAD_ICON}
                disabled
                onClick={() => 0}
                color="filled"
              >
                Upload
              </UKButton>
              <UKIconButton
                disabled
                alt="Reset"
                icon={REFRESH_ICON}
                onClick={() => 0}
                color="standard"
              />
            </>
          }
        />
        <UKStackItem
          labelText="Login Background"
          supportingText="Recommended size: 2560x1440px. This is displayed as the background of the user login page."
          inlineComponent={
            <>
              <UKButton
                class={styles.uploadButton}
                leadingIcon={UPLOAD_ICON}
                disabled
                onClick={() => 0}
                color="filled"
              >
                Upload
              </UKButton>
              <UKIconButton
                disabled
                alt="Reset"
                icon={REFRESH_ICON}
                onClick={() => 0}
                color="standard"
              />
            </>
          }
        />
        <UKStackItem
          labelText="Favicon"
          supportingText="Recommended size: 32x32px. This is displayed in the browser tab and bookmarks."
          inlineComponent={
            <>
              <UKButton
                class={styles.uploadButton}
                leadingIcon={UPLOAD_ICON}
                disabled
                onClick={() => 0}
                color="filled"
              >
                Upload
              </UKButton>
              <UKIconButton
                disabled
                alt="Reset"
                icon={REFRESH_ICON}
                onClick={() => 0}
                color="standard"
              />
            </>
          }
        />
        <UKStackItem
          labelText="Square Logo"
          supportingText="Recommended size: 256x256px. This is displayed in the app navigation rail."
          inlineComponent={
            <>
              <UKButton
                class={styles.uploadButton}
                leadingIcon={UPLOAD_ICON}
                disabled
                onClick={() => 0}
                color="filled"
              >
                Upload
              </UKButton>
              <UKIconButton
                disabled
                alt="Reset"
                icon={REFRESH_ICON}
                onClick={() => 0}
                color="standard"
              />
            </>
          }
        />
        <UKStackItem
          labelText="Default User Background"
          supportingText="Recommended size: 2560x1440px. This is displayed as the background of the dashboard unless changed by the user."
          inlineComponent={
            <>
              <UKButton
                class={styles.uploadButton}
                leadingIcon={UPLOAD_ICON}
                disabled
                onClick={() => 0}
                color="filled"
              >
                Upload
              </UKButton>
              <UKIconButton
                disabled
                alt="Reset"
                icon={REFRESH_ICON}
                onClick={() => 0}
                color="standard"
              />
            </>
          }
        />
        <UKStackItem
          labelText="Tagline"
          supportingText="This is a short phrase that describes your organization. It is displayed on the bottom of the login page."
          expandedComponent={
            <UKTextField label="Tagline" color="outlined" getValue={() => 0} setValue="" />
          }
        />
        <UKStackItem
          labelText="Display Name"
          supportingText="This is the name of your workspace. Is is displayed on the bottom of the login page and in the tab title."
          expandedComponent={
            <UKTextField label="Display Name" color="outlined" getValue={() => 0} setValue="" />
          }
        />
        <UKStackItem
          labelText="Meta Description"
          supportingText="This is a short description of your workspace. It is used for SEO purposes and may be displayed in search engine results."
          expandedComponent={
            <UKTextField label="Meta Description" color="outlined" getValue={() => 0} setValue="" />
          }
        />
      </UKStack>
    </>
  );
};

export default Branding;
