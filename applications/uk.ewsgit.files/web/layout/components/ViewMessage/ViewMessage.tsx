import type {Component} from "solid-js";
import styles from "./ViewMessage.module.scss"
import UKIcon from "@onlineworkspace/uikit-solid/src/components/icon/UKIcon.jsx";
import UKText from "@onlineworkspace/uikit-solid/src/components/text/UKText.jsx";
import UKDivider from "@onlineworkspace/uikit-solid/src/components/divider/UKDivider.jsx";
import UKButtonGroup from "@onlineworkspace/uikit-solid/src/components/buttonGroup/UKButtonGroup.jsx";

const ViewMessage: Component<{title: string, icon: string, message: string, actions?: {color: "elevated" | "filled" | "tonal" | "outlined" | "standard", label: string, onClick(): void}[]}> = (props) => {
  return <div class={styles.root}>
    <div class={styles.contentContainer}>
      <UKIcon>{props.icon}</UKIcon>
      <UKText role="title" size="l">{props.title}</UKText>
      <UKDivider direction="horizontal" />
      <UKText role="title" size="l">{props.message}</UKText>
    </div>
    {!!props.actions &&
      <UKButtonGroup size={"s"}>
        {null}
      </UKButtonGroup>
    }
  </div>
}

export default ViewMessage
