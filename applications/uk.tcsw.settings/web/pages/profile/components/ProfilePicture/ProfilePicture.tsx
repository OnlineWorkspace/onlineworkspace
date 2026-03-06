import UKStackItem from "@tcsw/uikit-solid/src/components/stack/UKStackItem.jsx";
import { type Component, createSignal } from "solid-js";
import styles from "./ProfilePicture.module.scss";
import CropImage from "./components/CropImage/CropImage.tsx";
import UKButton from "@tcsw/uikit-solid/src/components/button/UKButton.tsx";
import ImageSelectDialog
  from "./components/ImageSelectDialog/ImageSelectDialog.tsx";
import CropDialog from "./components/CropDialog/CropDialog.tsx";

const ProfilePicture: Component<{ refetchAvatar(): void }> = (props) => {
  const [showDialog, setShowDialog] = createSignal<"select" | "crop" | undefined>(undefined);

  return (
    <>
      <UKStackItem
        leading={{
          type: "icon",
          value: "photo_camera",
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
      <ImageSelectDialog show={showDialog() === "select"} onClose={() => setShowDialog(undefined)} openCropper={() => setShowDialog("crop")}/>
      <CropDialog show={showDialog() === "crop"} onClose={() => setShowDialog(undefined)} refetchAvatar={props.refetchAvatar}/>
    </>
  );
};

export default ProfilePicture;
