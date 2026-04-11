import ARROW_RIGHT_ICON from "@material-symbols/svg-700/outlined/arrow_right.svg";
import UKIcon from "@onlineworkspace/uikit-solid/src/components/icon/UKIcon.jsx";
import UKStackItem from "@onlineworkspace/uikit-solid/src/components/stack/UKStackItem.tsx";
import { useNavigate } from "@solidjs/router";
import type { Component } from "solid-js";
import styles from "./Shortcut.module.scss";

const Shortcut: Component<{
  title: string;
  description: string;
  icon: string;
  path: string;
}> = (props) => {
  const navigate = useNavigate();

  return (
    <UKStackItem
      leading={{
        type: "icon",
        value: props.icon,
      }}
      onClick={() => {
        navigate(props.path);

        return;
      }}
      labelText={props.title}
      supportingText={props.description}
      inlineComponent={<UKIcon class={styles.iconButton}>{ARROW_RIGHT_ICON}</UKIcon>}
    />
  );
};

export default Shortcut;
