import type { Accessor, Component } from "solid-js";
import UKDialog from "@tcsw/uikit-solid/src/components/dialog/UKDialog.tsx";
import UKButtonGroup from "@tcsw/uikit-solid/src/components/buttonGroup/UKButtonGroup.tsx";
import UKButton from "@tcsw/uikit-solid/src/components/button/UKButton.tsx";

const ImageSelectDialog: Component<{
  show: boolean;
  onClose: () => void;
  openCropper: () => void;
}> = (props) => {
  return (
    <UKDialog show={() => props.show} onClose={props.onClose}>
      <UKButtonGroup size={"s"}>
        <UKButton
          color={"filled"}
          onClick={() => {
            props.openCropper();
          }}
        >
          Upload new picture
        </UKButton>
        <UKButton color={"tonal"} onClick={props.onClose}>
          Cancel
        </UKButton>
      </UKButtonGroup>
    </UKDialog>
  );
};

export default ImageSelectDialog;
