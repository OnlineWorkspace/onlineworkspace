import CHECK_ICON from "@material-symbols/svg-700/outlined/check.svg";
import CLOSE_ICON from "@material-symbols/svg-700/outlined/close.svg";
import UKIcon from "@ewsgit/uikit-solid/src/components/icon/UKIcon.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import type { Component } from "solid-js";

const Requirement: Component<{ shouldDisplay: boolean; checkValue: boolean; label: string }> = (props) => {
  return (
    <>
      {props.shouldDisplay && (
        <>
          <UKIcon>{props.checkValue ? CHECK_ICON : CLOSE_ICON}</UKIcon>
          <UKText role={"label"} size={"m"}>
            {props.label}
          </UKText>
        </>
      )}
    </>
  );
};

export default Requirement;
