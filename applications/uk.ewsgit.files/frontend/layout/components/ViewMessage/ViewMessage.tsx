import { For, type Component } from "solid-js";
import styles from "./ViewMessage.module.scss";
import UKIcon from "@ewsgit/uikit-solid/src/components/icon/UKIcon.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import UKDivider from "@ewsgit/uikit-solid/src/components/divider/UKDivider.tsx";
import UKButtonGroup from "@ewsgit/uikit-solid/src/components/buttonGroup/UKButtonGroup.tsx";
import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";

const ViewMessage: Component<{
  title: string;
  icon: string;
  message: string;
  actions?: { color: "elevated" | "filled" | "tonal" | "outlined" | "standard"; label: string; onClick(): void }[];
}> = (props) => {
  return (
    <div class={styles.root}>
      <div class={styles.contentContainer}>
        <UKIcon class={styles.icon}>{props.icon}</UKIcon>
        <UKText role="title" size="l">
          {props.title}
        </UKText>
        <UKDivider direction="horizontal" />
        <UKText role="body" size="m">
          {props.message}
        </UKText>
      </div>
      {!!props.actions && (
        <UKButtonGroup size={"s"}>
          <For each={props.actions}>
            {(action) => (
              <UKButton onClick={action.onClick} color={action.color}>
                {action.label}
              </UKButton>
            )}
          </For>
        </UKButtonGroup>
      )}
    </div>
  );
};

export default ViewMessage;
