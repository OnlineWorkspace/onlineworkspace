import UKButton from "@tcsw/uikit-solid/src/components/button/UKButton.jsx";
import UKStack from "@tcsw/uikit-solid/src/components/stack/UKStack.jsx";
import UKStackItem from "@tcsw/uikit-solid/src/components/stack/UKStackItem.jsx";
import UKStackLabel from "@tcsw/uikit-solid/src/components/stack/UKStackLabel.jsx";
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
            <UKButton
              class={styles.uploadButton}
              leadingIcon={"upload"}
              disabled
              onClick={() => 0}
              color="filled"
            >
              Upload
            </UKButton>
          }
        />
        <UKStackItem
          labelText="Login Background"
          supportingText="Recommended size: 2560x1440px. This is displayed as the background of the user login page."
          inlineComponent={
            <UKButton
              class={styles.uploadButton}
              leadingIcon={"upload"}
              disabled
              onClick={() => 0}
              color="filled"
            >
              Upload
            </UKButton>
          }
        />
        <UKStackItem
          labelText="Favicon"
          supportingText="Recommended size: 32x32px. This is displayed in the browser tab and bookmarks."
          inlineComponent={
            <UKButton
              class={styles.uploadButton}
              leadingIcon={"upload"}
              disabled
              onClick={() => 0}
              color="filled"
            >
              Upload
            </UKButton>
          }
        />
        <UKStackItem
          labelText="Square Logo"
          supportingText="Recommended size: 256x256px. This is displayed in the app navigation rail."
          inlineComponent={
            <UKButton
              class={styles.uploadButton}
              leadingIcon={"upload"}
              disabled
              onClick={() => 0}
              color="filled"
            >
              Upload
            </UKButton>
          }
        />
        <UKStackItem
          labelText="Default User Background"
          supportingText="Recommended size: 2560x1440px. This is displayed as the background of the dashboard unless changed by the user."
          inlineComponent={
            <UKButton
              class={styles.uploadButton}
              leadingIcon={"upload"}
              disabled
              onClick={() => 0}
              color="filled"
            >
              Upload
            </UKButton>
          }
        />
      </UKStack>
    </>
  );
};

export default Branding;
