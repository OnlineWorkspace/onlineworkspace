import {
  createSignal,
  type Component,
  type JSX,
  type ParentProps,
} from "solid-js";
import type { ButtonSize } from "./lib/size.ts";
import clsx from "clsx";
import UKIcon from "../icon/UKIcon.tsx";
import type { ButtonShape } from "./lib/shape.ts";
import type { ButtonColor } from "./lib/color.ts";
import styles from "./UKButton.module.scss";

type ButtonProps =
  | {
      class?: string;
      disabled?: boolean;
      size?: ButtonSize;
      color?: ButtonColor;
      shape?: ButtonShape;
      type?: "normal" | "toggle";
      onClick: (
        event: MouseEvent & {
          currentTarget: HTMLButtonElement;
          target: Element;
        },
      ) => void;
      affirmative?: false;
      leadingIcon?: string;
      trailingIcon?: string;
    }
  | {
      class?: string;
      disabled?: boolean;
      size?: ButtonSize;
      color?: ButtonColor;
      shape?: ButtonShape;
      type?: "normal";
      onClick: (
        event: MouseEvent & {
          currentTarget: HTMLButtonElement;
          target: Element;
        },
      ) => Promise<any>;
      affirmative: true;
      trailingIcon?: string;
    };

const UKButton: Component<ParentProps<ButtonProps>> = (props) => {
  const [isSelected, setIsSelected] = createSignal(false);
  const [affirmativeState, setAffirmativeState] = createSignal<
    "in-progress" | "affirmative" | "unset"
  >("unset");

  if (props.color === "standard" && props.type === "toggle") {
    alert("You cannot have a standard color button be toggleable");
  }

  return (
    <button
      disabled={props.disabled || false}
      data-selected={isSelected()}
      data-toggleable={props.type === "toggle" || false}
      data-size={props.size || "s"}
      data-shape={
        isSelected()
          ? (props.shape || "round") === "round"
            ? "square"
            : "round"
          : props.shape || "round"
      }
      data-color={props.color || "filled"}
      onClick={async (e) => {
        e.stopPropagation();
        if (props.type === "toggle") {
          setIsSelected(!isSelected());
          props.onClick(e);
        } else {
          if (props.affirmative) {
            if (affirmativeState() === "in-progress") {
              return;
            }

            setAffirmativeState("in-progress");
            try {
              await props.onClick(e);

              setAffirmativeState("affirmative");

              setTimeout(() => {
                setAffirmativeState("unset");
              }, 2000);
            } catch (error) {
              setAffirmativeState("unset");
            }
            return;
          }

          props.onClick(e);
        }
      }}
      class={clsx(
        styles.root,
        props.class,
        affirmativeState() === "in-progress" && styles.inProgress,
      )}
      type="button"
    >
      {props.affirmative ? (
        affirmativeState() === "unset" ||
        affirmativeState() === "affirmative" ? (
          <UKIcon
            class={clsx(
              styles.iconClass,
              affirmativeState() === "unset" && styles.leadingIconNoWidth,
            )}
          >
            {affirmativeState() === "affirmative" ? "check" : ""}
          </UKIcon>
        ) : affirmativeState() === "in-progress" ? (
          <UKIcon class={clsx(styles.iconClass, styles.leadingIconSpin)}>
            progress_activity
          </UKIcon>
        ) : null
      ) : (
        props.leadingIcon && (
          <UKIcon class={styles.iconClass}>{props.leadingIcon}</UKIcon>
        )
      )}
      {props.children || "No Label Provided"}
      {props.trailingIcon && (
        <UKIcon class={styles.iconClass}>{props.trailingIcon}</UKIcon>
      )}
    </button>
  );
};

export default UKButton;
