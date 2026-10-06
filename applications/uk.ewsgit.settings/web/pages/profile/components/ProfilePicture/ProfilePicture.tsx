import PHOTO_CAMERA_ICON from "@material-symbols/svg-700/outlined/photo_camera.svg";
import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import { type Component, createSignal } from "solid-js";
import CropDialog from "./components/CropDialog/CropDialog.tsx";
import ImageSelectDialog from "./components/ImageSelectDialog/ImageSelectDialog.tsx";

const ProfilePicture: Component<{ refetchAvatar(): void }> = (props) => {
  const [showDialog, setShowDialog] = createSignal<"select" | "crop" | undefined>(undefined);

  return (
    <>
      <UKButton color="tonal" leadingIcon={PHOTO_CAMERA_ICON} onClick={() => setShowDialog("select")}>
        Change photo
      </UKButton>
      <ImageSelectDialog show={showDialog() === "select"} onClose={() => setShowDialog(undefined)} openCropper={() => setShowDialog("crop")} />
      <CropDialog show={showDialog() === "crop"} onClose={() => setShowDialog(undefined)} refetchAvatar={props.refetchAvatar} />
    </>
  );
};

export default ProfilePicture;
