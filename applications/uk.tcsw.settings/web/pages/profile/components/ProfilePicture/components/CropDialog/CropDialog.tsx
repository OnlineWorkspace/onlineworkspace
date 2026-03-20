import UKDialog from "@tcsw/uikit-solid/src/components/dialog/UKDialog.tsx";
import type { Component } from "solid-js";
import CropImage from "../CropImage/CropImage.tsx";

const CropDialog: Component<{
  show: boolean;
  onClose: () => void;
  refetchAvatar: () => void;
}> = (props) => {
  return (
    <UKDialog show={() => props.show} onClose={props.onClose}>
      <CropImage refetchAvatar={props.refetchAvatar} close={props.onClose} />
    </UKDialog>
  );
};

export default CropDialog;
