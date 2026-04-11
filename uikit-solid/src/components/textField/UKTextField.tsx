import VISIBILITY_ICON from "@material-symbols/svg-700/outlined/visibility.svg";
import VISIBILITY_OFF_ICON from "@material-symbols/svg-700/outlined/visibility_off.svg";
import clsx from "clsx";
import { type Accessor, type Component, createEffect, createSignal } from "solid-js";
import type { DOMElement } from "solid-js/jsx-runtime";
import UKIcon from "../icon/UKIcon";
import styles from "./UKTextField.module.scss";

// TODO: add reveal password 'eye' icon
const UKTextField: Component<
  {
    color: "filled" | "outlined";
    leadingIcon?: { icon: string; onClick?: () => void };
    labelEmpty?: string;
    label: string;
    supportingText?: string;
    onValueChange: (value: string) => void;
    onEscape?: () => void;
    onSubmit?: () => void;
    onFocus?: () => void;
    onBlur?: () => void;
    defaultValue?: string;
    value?: string;
    maximumCharacterCount?: number;
    forceVisualFocus?: boolean;
    as?: "textarea" | "input";
    error?: boolean;
    class?: string;
    containerClass?: string;
    autocomplete?: string;
  } & (
    | {
        shouldMask: true;
        as?: "input";
      }
    | {
        trailingIcon?: { icon: string; onClick?: () => void };
      }
  )
> = (props) => {
  const [characterLength, setCharacterLength] = createSignal<number>(0);
  const [forceVisible, setForceVisible] = createSignal<boolean>(false);
  let textAreaRef!: HTMLTextAreaElement;
  let inputRef!: HTMLInputElement;

  if (props.defaultValue && props.defaultValue !== "") {
    setCharacterLength(props.defaultValue.length);
  }

  const elementProperties = {
    class: clsx(props.class, styles.input),
    onKeyUp: (
      e: KeyboardEvent & {
        currentTarget: HTMLInputElement | HTMLTextAreaElement;
        target: DOMElement;
      },
    ) => {
      if (e.key === "Escape") {
        e.currentTarget.blur();
        props.onEscape?.();
      }

      setCharacterLength(e.currentTarget.value.length);

      props.onValueChange(e.currentTarget.value);
    },
    onSubmit: props.onSubmit,
    value: props.defaultValue,
    maxLength: props.maximumCharacterCount,
    type: "shouldMask" in props ? (props.shouldMask === true ? "password" : "text") : "text",
    onFocus: props.onFocus,
    onBlur: props.onBlur,
    autocomplete: props.autocomplete,
  };

  createEffect(() => {
    if (props.value === undefined) return;

    if (textAreaRef) {
      textAreaRef.value = props.value;

      setCharacterLength(textAreaRef.value.length);

      props.onValueChange(textAreaRef.value);
    }
    if (inputRef) {
      inputRef.value = props.value;

      setCharacterLength(inputRef.value.length);

      props.onValueChange(inputRef.value);
    }
  });

  createEffect(() => {
    if ("shouldMask" in props) {
      if (props.shouldMask !== true) return;

      if (forceVisible()) {
        inputRef.type = "text";
      } else {
        inputRef.type = "password";
      }
    }
  });

  return (
    <div class={clsx(styles.container, props.containerClass)}>
      <div
        class={styles.root}
        data-error={props.error}
        data-color={props.color}
        data-populated={characterLength() > 0}
        data-force-focus={props.forceVisualFocus}
      >
        {props.leadingIcon && (
          <UKIcon onClick={props.leadingIcon.onClick} class={styles.leadingIcon}>
            {props.leadingIcon.icon}
          </UKIcon>
        )}
        <div class={styles.inputContainer}>
          {props.as === "textarea" ? <textarea ref={textAreaRef} {...elementProperties} /> : <input ref={inputRef} {...elementProperties} />}
          <span class={styles.labelText}>{props.labelEmpty !== undefined ? (characterLength() > 0 ? props.label : props.labelEmpty) : props.label}</span>
        </div>
        {"shouldMask" in props && props.shouldMask === true ? (
          <UKIcon
            onClick={() => {
              setForceVisible((prev) => !prev);
            }}
            class={clsx(styles.trailingIcon, styles.visibilityIcon)}
          >
            {forceVisible() ? VISIBILITY_ICON : VISIBILITY_OFF_ICON}
          </UKIcon>
        ) : (
          "trailingIcon" in props &&
          props.trailingIcon && (
            <UKIcon onClick={props.trailingIcon.onClick} class={styles.trailingIcon}>
              {props.trailingIcon.icon}
            </UKIcon>
          )
        )}
      </div>
      {(props.supportingText || props.maximumCharacterCount) && (
        <span data-error={props.error} class={styles.supportingText}>
          <div>{props.supportingText}</div>
          {props.maximumCharacterCount !== undefined && (
            <div>
              {characterLength()}/{props.maximumCharacterCount}
            </div>
          )}
        </span>
      )}
    </div>
  );
};

export default UKTextField;
