import clsx from "clsx";
import type { Component } from "solid-js";
import { createSignal, onCleanup } from "solid-js";
import UKIcon from "../icon/UKIcon";
import styles from "./UKSwitch.module.scss";

const UKSwitch: Component<{
  value: boolean;
  onValueChange: (value: boolean) => void;
  class?: string;
  icon?: boolean;
  disabled?: boolean;
}> = (props) => {
  const [isDragging, setIsDragging] = createSignal(false);
  const [dragStart, setDragStart] = createSignal(0);

  const removeMouseUpListener = () => {
    window.removeEventListener("mouseup", handleWindowMouseUp);
  };

  const handleWindowMouseUp = (e: MouseEvent) => {
    if (!isDragging()) return;
    setIsDragging(false);
    removeMouseUpListener();

    const dragDistance = e.clientX - dragStart();
    const dragThreshold = 10;

    if (Math.abs(dragDistance) > dragThreshold) {
      props.onValueChange(dragDistance > 0);
    }
  };

  const handlePointerDown = (e: PointerEvent) => {
    if (props.disabled) return;
    setIsDragging(true);
    setDragStart(e.clientX);

    window.addEventListener("mouseup", handleWindowMouseUp);
  };

  onCleanup(removeMouseUpListener);

  return (
    <button
      type="button"
      class={clsx(styles.root, props.class)}
      data-value={props.value}
      onClick={() => props.onValueChange(!props.value)}
      onPointerDown={handlePointerDown}
      disabled={props.disabled}
    >
      <div data-icon={!!props.icon} class={styles.handle}>
        {props.icon && <UKIcon>check</UKIcon>}
      </div>
    </button>
  );
};

export default UKSwitch;
