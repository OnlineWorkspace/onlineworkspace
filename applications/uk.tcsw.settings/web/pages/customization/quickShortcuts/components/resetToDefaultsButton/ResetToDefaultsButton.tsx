import { type Component, createSignal } from "solid-js";
import UKButton from "@tcsw/uikit-solid/src/components/button/UKButton.tsx";
import UKNoPointOfReturnDialog from "@tcsw/uikit-solid/src/components/dialog/prefabs/noPointOfReturn/UKNoPointOfReturnDialog.tsx";
import trpc from "../../../../../lib/trpc.ts";

const ResetToDefaultsButton: Component<{ refetchData: () => void }> = (props) => {
  const [showDialog, setShowDialog] = createSignal<boolean>(false);

  return (
    <>
      <UKButton
        size={"s"}
        leadingIcon={"refresh"}
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
          setShowDialog(false);
          await trpc.customization.quickShortcuts.resetToDefaults.mutate();
          props.refetchData();
        }}
        onDeny={() => {
          setShowDialog(false);
        }}
      />
    </>
  );
};

export default ResetToDefaultsButton;
