import PHOTO_CAMERA_ICON from "@material-symbols/svg-700/outlined/photo_camera.svg";
import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKStackItem from "@ewsgit/uikit-solid/src/components/stack/UKStackItem.tsx";
import { type Component, createSignal } from "solid-js";
import CropDialog from "./components/CropDialog/CropDialog.tsx";
import ImageSelectDialog from "./components/ImageSelectDialog/ImageSelectDialog.tsx";
import styles from "./ProfilePicture.module.scss";

const ProfilePicture: Component<{ refetchAvatar(): void }> = (props) => {
  const [showDialog, setShowDialog] = createSignal<"select" | "crop" | undefined>(undefined);

  return (
    <>
      <UKStackItem
        leading={{
          type: "icon",
          value: PHOTO_CAMERA_ICON,
        }}
        labelText="Profile picture"
        supportingText="Help people identify you at a glance"
        inlineComponent={
          <UKButton
            class={styles.updateButton}
            color="filled"
            onClick={() => {
              setShowDialog("select");
            }}
          >
            Update picture
          </UKButton>
        }
        // expandedComponent={
        //   <div class={styles.expanded}>
        //     <CropImage refetchAvatar={props.refetchAvatar} />
        //   </div>
        // }
      />
      <ImageSelectDialog show={showDialog() === "select"} onClose={() => setShowDialog(undefined)} openCropper={() => setShowDialog("crop")} />
      <CropDialog show={showDialog() === "crop"} onClose={() => setShowDialog(undefined)} refetchAvatar={props.refetchAvatar} />
    </>
  );
};

export default ProfilePicture;
