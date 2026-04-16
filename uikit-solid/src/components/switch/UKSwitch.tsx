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
    window.removeEventListener("touchend", handleWindowMouseUp);
  };

  const handleWindowMouseUp = (e: MouseEvent | TouchEvent) => {
    if (!isDragging()) return;
    setIsDragging(false);
    removeMouseUpListener();

    let posX: number = 0;

    if ("touches" in e) {
      posX = e.touches[0].clientX;
    } else {
      posX = e.clientX;
    }

    const dragDistance = posX - dragStart();
    const dragThreshold = 10;

    if (Math.abs(dragDistance) > dragThreshold) {
      props.onValueChange(dragDistance > 0);
    }
  };

  const handlePointerDown = (e: PointerEvent | TouchEvent) => {
    if (props.disabled) return;
    setIsDragging(true);

    let posX: number = 0;

    if ("touches" in e) {
      posX = e.touches[0].clientX;
    } else {
      posX = e.clientX;
    }

    setDragStart(posX);

    window.addEventListener("mouseup", handleWindowMouseUp);
    window.addEventListener("touchend", handleWindowMouseUp);
  };

  onCleanup(removeMouseUpListener);

  return (
    <button
      type="button"
      class={clsx(styles.root, props.class)}
      data-value={props.value}
      onClick={() => props.onValueChange(!props.value)}
      onPointerDown={handlePointerDown}
      onTouchStart={handlePointerDown}
      disabled={props.disabled}
    >
      <div data-icon={!!props.icon} class={styles.handle}>
        {props.icon && <UKIcon>check</UKIcon>}
      </div>
    </button>
  );
};

export default UKSwitch;
