import UKStackItem from "@ewsgit/uikit-solid/src/components/stack/UKStackItem.tsx";
import type { Component } from "solid-js";
import UKTextField from "@ewsgit/uikit-solid/src/components/textField/UKTextField.tsx";
import brandingStyles from "../../Branding.module.scss";
import UKButton, { AffirmativeButtonState } from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";

const DisplayName: Component = () => {
  return (
    <UKStackItem
      labelText="Display Name"
      supportingText="This is the name of your workspace. Is is displayed on the bottom of the login page and in the tab title."
      expandedComponent={
        <div class={brandingStyles.expandedContent}>
          <UKTextField label="Display Name" color="outlined" onValueChange={() => 0} value="" />
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

export default DisplayName;
