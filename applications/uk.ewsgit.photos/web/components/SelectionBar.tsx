import CLOSE_ICON from "@material-symbols/svg-700/outlined/close.svg";
import UKIconButton from "@ewsgit/uikit-solid/src/components/iconButton/UKIconButton.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import { type Component, For } from "solid-js";
import styles from "./SelectionBar.module.scss";

export interface SelectionAction {
  icon: string;
  label: string;
  onClick: () => void;
}

/** Replaces the page's top bar while photos are selected. */
const SelectionBar: Component<{ count: number; actions: SelectionAction[]; onClose: () => void }> = (props) => {
  return (
    <div class={styles.root} role="toolbar" aria-label="Selection">
      <UKIconButton color="standard" icon={CLOSE_ICON} alt="Clear selection" onClick={props.onClose} />
      <UKText role="title" size="l" class={styles.count}>
        {props.count.toLocaleString()} selected
      </UKText>
      <For each={props.actions}>{(action) => <UKIconButton color="standard" icon={action.icon} alt={action.label} onClick={action.onClick} />}</For>
    </div>
  );
};

export default SelectionBar;
