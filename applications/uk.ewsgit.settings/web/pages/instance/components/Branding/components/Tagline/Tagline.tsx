import UKStackItem from "@onlineworkspace/uikit-solid/src/components/stack/UKStackItem.jsx";
import type { Component } from "solid-js";
import UKTextField from "@onlineworkspace/uikit-solid/src/components/textField/UKTextField.jsx";
import brandingStyles from "../../Branding.module.scss";
import UKButton, { AffirmativeButtonState } from "@onlineworkspace/uikit-solid/src/components/button/UKButton.jsx";

const Tagline: Component = () => {
  return (
    <UKStackItem
      labelText="Tagline"
      supportingText="This is a short phrase that describes your organization. It is displayed on the bottom of the login page."
      expandedComponent={
        <div class={brandingStyles.expandedContent}>
          <UKTextField label="Tagline" color="outlined" onValueChange={() => 0} value="" />
          <UKButton
            class={brandingStyles.saveButton}
            affirmative
            onClick={async () => {
              return { state: AffirmativeButtonState.Success };
            }}
          >
            Save
          </UKButton>
        </div>
      }
    />
  );
};

export default Tagline;
