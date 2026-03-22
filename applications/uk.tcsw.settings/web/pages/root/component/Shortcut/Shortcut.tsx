import { useNavigate } from "@solidjs/router";
import UKIcon from "@tcsw/uikit-solid/src/components/icon/UKIcon.jsx";
import UKStackItem from "@tcsw/uikit-solid/src/components/stack/UKStackItem.tsx";
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
      inlineComponent={<UKIcon class={styles.iconButton}>arrow_right</UKIcon>}
    />
  );
};

export default Shortcut;
