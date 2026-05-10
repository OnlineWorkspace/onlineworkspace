import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKButtonGroup from "@ewsgit/uikit-solid/src/components/buttonGroup/UKButtonGroup.tsx";
import UKDialog from "@ewsgit/uikit-solid/src/components/dialog/UKDialog.tsx";
import UKDivider from "@ewsgit/uikit-solid/src/components/divider/UKDivider.jsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.jsx";
import type { Component } from "solid-js";
import styles from "./ImageSelectDialog.module.scss";

const ImageSelectDialog: Component<{
  show: boolean;
  onClose: () => void;
  openCropper: () => void;
}> = (props) => {
  return (
    <UKDialog show={() => props.show} onClose={props.onClose} maxWidth="32rem">
      <UKText role="title" size="l">
        Change your profile picture
      </UKText>
      <UKDivider direction="horizontal" />
      <UKText size="l" role="body">
        Are you sure you would like to change your profile picture?
      </UKText>
      <UKText size="l" role="label">
        Please note, your new profile picture will be publicly visible.
      </UKText>
      <UKButtonGroup size={"s"} align="end" class={styles.buttonGroup}>
        <UKButton color={"tonal"} onClick={props.onClose}>
          Cancel
        </UKButton>
        <UKButton
          color={"filled"}
          onClick={() => {
            props.openCropper();
          }}
        >
          Upload new picture
        </UKButton>
      </UKButtonGroup>
    </UKDialog>
  );
};

export default ImageSelectDialog;
