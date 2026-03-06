import type { Component } from "solid-js";
import UKDialog from "@tcsw/uikit-solid/src/components/dialog/UKDialog.tsx";
import CropImage from "../CropImage/CropImage.tsx";

const CropDialog: Component<{
  show: boolean;
  onClose: () => void;
  refetchAvatar: () => void;
}> = (props) => {
  return (
    <UKDialog show={() => props.show} onClose={props.onClose}>
      <CropImage refetchAvatar={props.refetchAvatar} />
    </UKDialog>
  );
};

export default CropDialog;
