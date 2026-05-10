import REFRESH_ICON from "@material-symbols/svg-700/outlined/refresh.svg";
import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKNoPointOfReturnDialog from "@ewsgit/uikit-solid/src/components/dialog/prefabs/noPointOfReturn/UKNoPointOfReturnDialog.tsx";
import { type Component, createSignal } from "solid-js";

const ResetToDefaultsButton: Component<{ onReset: () => Promise<void> }> = (props) => {
  const [showDialog, setShowDialog] = createSignal<boolean>(false);

  return (
    <>
      <UKButton
        size={"s"}
        leadingIcon={REFRESH_ICON}
        color={"standard"}
        onClick={() => {
          setShowDialog(true);
        }}
      >
        Reset to defaults
      </UKButton>
      <UKNoPointOfReturnDialog
        message={"Reset quick shortcuts to defaults?"}
        show={showDialog}
        onConfirm={async () => {
          await props.onReset();
          setShowDialog(false);
        }}
        onDeny={() => {
          setShowDialog(false);
        }}
      />
    </>
  );
};

export default ResetToDefaultsButton;
