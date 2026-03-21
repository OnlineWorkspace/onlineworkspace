import clsx from "clsx";
import { type Component, createSignal } from "solid-js";
import UKIcon from "../icon/UKIcon";
import type { IconButtonColor } from "./lib/color";
import type { IconButtonShape } from "./lib/shape";
import type { IconButtonSize } from "./lib/size";
import type { IconButtonWidth } from "./lib/width";
import styles from "./UKIconButton.module.scss";

// TODO: implement smooth animations as is done with UKButton

const UKIconButton: Component<{
  icon: string;
  alt: string;
  onClick: (event: MouseEvent & { currentTarget: HTMLButtonElement; target: Element }) => void;
  width?: IconButtonWidth;
  shape?: IconButtonShape;
  color?: IconButtonColor;
  size?: IconButtonSize;
  class?: string;
  iconClass?: string;
  type?: "normal" | "toggle";
  disabled?: boolean;
}> = (props) => {
  const [isSelected, setIsSelected] = createSignal(false);

  return (
    <button
      type="button"
      data-width={props.width || "default"}
      data-shape={props.shape || "round"}
      data-size={props.size || "s"}
      data-type={props.type || "normal"}
      data-color={props.color || "filled"}
      data-selected={isSelected()}
      disabled={props.disabled || false}
      onClick={(e) => {
        e.stopPropagation();
        if (props.type === "toggle") {
          setIsSelected(!isSelected());
          props.onClick(e);
        } else {
          props.onClick(e);
        }
      }}
      class={clsx(props.class, styles.root)}
      aria-label={props.alt}
    >
      <UKIcon class={props.iconClass}>{props.icon}</UKIcon>
    </button>
  );
};

export default UKIconButton;
