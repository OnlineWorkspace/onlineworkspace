import type { Accessor, Component } from "solid-js";
import UKButton from "../../../button/UKButton.tsx";
import UKButtonGroup from "../../../buttonGroup/UKButtonGroup.tsx";
import UKText from "../../../text/UKText.tsx";
import UKDialog from "../../UKDialog.tsx";

const UKNoPointOfReturnDialog: Component<{
  message: string;
  onConfirm: () => void;
  onDeny: () => void;
  show: Accessor<boolean>;
}> = (props) => {
  return (
    <UKDialog maxWidth={"32rem"} onClose={props.onDeny} show={props.show}>
      <UKText role={"title"} size={"l"}>
        {props.message}
      </UKText>
      <UKText role={"body"} size={"m"}>
        This action cannot be undone.
      </UKText>
      <UKButtonGroup size={"s"} align={"end"}>
        <UKButton
          size={"s"}
          color={"tonal"}
          onClick={() => {
            props.onDeny();
          }}
        >
          Cancel
        </UKButton>
        <UKButton
          size={"s"}
          onClick={() => {
            props.onConfirm();
          }}
        >
          Confirm
        </UKButton>
      </UKButtonGroup>
    </UKDialog>
  );
};

export default UKNoPointOfReturnDialog;
