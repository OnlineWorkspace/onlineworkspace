import UKStackItem from "@ewsgit/uikit-solid/src/components/stack/UKStackItem.tsx";
import type { Component } from "solid-js";
import UKTextField from "@ewsgit/uikit-solid/src/components/textField/UKTextField.tsx";
import brandingStyles from "../../Branding.module.scss";
import UKButton, { AffirmativeButtonState } from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";

const MetaDescription: Component = () => {
  return (
    <UKStackItem
      labelText="Meta Description"
      supportingText="This is a short description of your workspace. It is used for SEO purposes and may be displayed in search engine results."
      expandedComponent={
        <div class={brandingStyles.expandedContent}>
          <UKTextField as={"textarea"} label="Meta Description" color="outlined" onValueChange={() => 0} value="" />
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

export default MetaDescription;
