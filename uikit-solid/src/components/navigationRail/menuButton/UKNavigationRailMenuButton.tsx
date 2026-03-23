import MENU_ICON from "@material-symbols/svg-700/outlined/menu.svg";
import MENU_OPEN_ICON from "@material-symbols/svg-700/outlined/menu_open.svg";
import clsx from "clsx";
import type { Component } from "solid-js";
import UKIconButton from "../../iconButton/UKIconButton";
import styles from "./UKNavigationRailMenuButton.module.scss";

const UKNavigationRailMenuButton: Component<{
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
}> = (props) => {
  return (
    <div class={styles.root}>
      <UKIconButton
        iconClass={clsx(styles.icon, props.expanded && styles.expanded)}
        color={"standard"}
        alt="toggle menu"
        onClick={() => props.setExpanded(!props.expanded)}
        icon={props.expanded ? MENU_OPEN_ICON : MENU_ICON}
      />
    </div>
  );
};

export default UKNavigationRailMenuButton;
