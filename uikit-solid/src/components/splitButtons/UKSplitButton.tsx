import {createSignal, type Component} from "solid-js";
import UKButton from "../button/UKButton";
import type {SplitButtonColor} from "./lib/color";
import type {SplitButtonSize} from "./lib/size";
import UKIconButton from "../iconButton/UKIconButton";
import styles from "./UKSplitButton.module.scss"

const UKSplitButton: Component<{
  children: string;
  class?: string;
  color?: SplitButtonColor;
  disabled?: boolean;
  onClick: (event: MouseEvent & {currentTarget: HTMLButtonElement; target: Element}) => void;
  size?: SplitButtonSize;
  // TODO: create a type for this
  dropDownItems: unknown;
}> = (props) => {
  const [ dropdownSelected, setDropdownSelected ] = createSignal<boolean>(false);

  return (
    <div class={styles.root}>
      <UKButton class={styles.textButton} color={props.color} onClick={props.onClick}>
        {props.children}
      </UKButton>
      <UKIconButton
        class={styles.iconButton}
        icon={"stat_minus_1"}
        alt="alt"
        onClick={() => {
          setDropdownSelected(!dropdownSelected());
        }}
      />
      {/* TODO: add a menu here! */}
    </div>
  );
};

export default UKSplitButton;
