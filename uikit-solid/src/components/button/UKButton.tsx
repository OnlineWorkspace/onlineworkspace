import CHECK_ICON from "@material-symbols/svg-700/outlined/check.svg";
import ERROR_ICON from "@material-symbols/svg-700/outlined/error.svg";
import PROGRESS_ACTIVITY_ICON from "@material-symbols/svg-700/outlined/progress_activity.svg";
import clsx from "clsx";
import { createSignal, type ParentProps } from "solid-js";
import UKIcon from "../icon/UKIcon.tsx";
import type { ButtonColor } from "./lib/color.ts";
import type { ButtonShape } from "./lib/shape.ts";
import type { ButtonSize } from "./lib/size.ts";
import styles from "./UKButton.module.scss";

export enum AffirmativeButtonState {
  Success,
  Error,
  InProgress,
  Unset,
}

type ButtonProps<Affirmative extends true | undefined = undefined> = {
  class?: string;
  disabled?: boolean;
  size?: ButtonSize;
  color?: ButtonColor;
  shape?: ButtonShape;
  type?: "normal" | "toggle";
  onClick: Affirmative extends true
    ? (
        event: MouseEvent & {
          currentTarget: HTMLButtonElement;
          target: Element;
        },
      ) => Promise<{ state: AffirmativeButtonState; cb?: () => void | Promise<void> }>
    : (
        event: MouseEvent & {
          currentTarget: HTMLButtonElement;
          target: Element;
        },
      ) => void | Promise<void>;
  affirmative?: Affirmative;
  leadingIcon?: string;
  trailingIcon?: string;
} & (Affirmative extends true
  ? {
      onSuccess?: () => void;
      onError?: () => void;
    }
  : unknown);

const AFFIRMATIVE_BUTTON_HOLD_TIME = 1000;

const UKButton = <Affirmative extends true | undefined = undefined>(props: ParentProps<ButtonProps<Affirmative>>) => {
  const [isSelected, setIsSelected] = createSignal(false);
  const [affirmativeState, setAffirmativeState] = createSignal<AffirmativeButtonState>(AffirmativeButtonState.Unset);

  if (props.color === "standard" && props.type === "toggle") {
    alert("You cannot have a standard color button be toggleable");
  }

  return (
    <button
      disabled={props.disabled || false}
      data-selected={isSelected()}
      data-toggleable={props.type === "toggle" || false}
      data-size={props.size || "s"}
      data-shape={isSelected() ? ((props.shape || "round") === "round" ? "square" : "round") : props.shape || "round"}
      data-color={props.color || "filled"}
      onClick={async (e) => {
        e.stopPropagation();
        if (props.type === "toggle") {
          setIsSelected(!isSelected());
          props.onClick(e);
          return;
        }
        if (props.affirmative) {
          if (affirmativeState() !== AffirmativeButtonState.Unset) {
            return;
          }

          setAffirmativeState(AffirmativeButtonState.InProgress);

          try {
            const clickResponse = await props.onClick(e);

            setAffirmativeState(clickResponse?.state || AffirmativeButtonState.Success);

            setTimeout(() => {
              setAffirmativeState(AffirmativeButtonState.Unset);

              clickResponse?.cb?.();
            }, AFFIRMATIVE_BUTTON_HOLD_TIME);
          } catch (_) {
            setAffirmativeState(AffirmativeButtonState.Unset);
          }

          return;
        }

        props.onClick(e);
      }}
      class={clsx(styles.root, props.class, affirmativeState() === AffirmativeButtonState.InProgress && styles.inProgress)}
      type="button"
    >
      {props.affirmative ? (
        <UKIcon
          class={clsx(
            styles.iconClass,
            affirmativeState() === AffirmativeButtonState.InProgress && styles.leadingIconSpin,
            affirmativeState() === AffirmativeButtonState.Unset && styles.leadingIconNoWidth,
          )}
        >
          {affirmativeState() === AffirmativeButtonState.Success
            ? CHECK_ICON
            : affirmativeState() === AffirmativeButtonState.InProgress
              ? PROGRESS_ACTIVITY_ICON
              : affirmativeState() === AffirmativeButtonState.Error
                ? ERROR_ICON
                : props.leadingIcon || ""}
        </UKIcon>
      ) : (
        props.leadingIcon && <UKIcon class={styles.iconClass}>{props.leadingIcon}</UKIcon>
      )}
      {props.children || "No Label Provided"}
      {props.trailingIcon && <UKIcon class={styles.iconClass}>{props.trailingIcon}</UKIcon>}
    </button>
  );
};

export default UKButton;
