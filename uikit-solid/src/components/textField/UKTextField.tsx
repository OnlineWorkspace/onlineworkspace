import { type Component, createEffect, createSignal, onMount } from "solid-js";
import styles from "./UKTextField.module.scss";
import type { DOMElement } from "solid-js/jsx-runtime";
import clsx from "clsx";
import UKIcon from "../icon/UKIcon";

// TODO: add reveal password 'eye' icon
const UKTextField: Component<{
    color: "filled" | "outlined";
    leadingIcon?: { icon: string; onClick?: () => void };
    labelEmpty?: string;
    label: string;
    trailingIcon?: { icon: string; onClick?: () => void };
    supportingText?: string;
    getValue: (value: string) => void;
    onEscape?: () => void;
    onSubmit?: () => void;
    onFocus?: () => void;
    onBlur?: () => void;
    defaultValue?: string;
    setValue?: string;
    maximumCharacterCount?: number;
    shouldMask?: boolean;
    forceFocussed?: boolean;
    as?: "textarea" | "input";
    error?: boolean;
    class?: string;
    containerClass?: string;
    autocomplete?: string;
}> = (props) => {
    const [characterLength, setCharacterLength] = createSignal<number>(0);
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

            props.getValue(e.currentTarget.value);
        },
        onSubmit: props.onSubmit,
        value: props.defaultValue,
        maxLength: props.maximumCharacterCount,
        type: props.shouldMask ? "password" : "text",
        onFocus: props.onFocus,
        onBlur: props.onBlur,
        autocomplete: props.autocomplete,
    };

    createEffect(() => {
        if (props.setValue === undefined) return;

        if (textAreaRef) {
            textAreaRef.value = props.setValue;

            setCharacterLength(textAreaRef.value.length);

            props.getValue(textAreaRef.value);
        }
        if (inputRef) {
            inputRef.value = props.setValue;

            setCharacterLength(inputRef.value.length);

            props.getValue(inputRef.value);
        }
    }, [props.setValue]);

    return (
        <div class={clsx(styles.container, props.containerClass)}>
            <div
                class={styles.root}
                data-error={props.error}
                data-color={props.color}
                data-populated={characterLength() > 0}
                data-force-focus={props.forceFocussed}
            >
                {props.leadingIcon && (
                    <UKIcon onClick={props.leadingIcon.onClick} class={styles.leadingIcon}>
                        {props.leadingIcon.icon}
                    </UKIcon>
                )}
                <div class={styles.inputContainer}>
                    {props.as === "textarea" ? (
                        <textarea ref={textAreaRef} {...elementProperties} />
                    ) : (
                        <input ref={inputRef} {...elementProperties} />
                    )}
                    <span class={styles.labelText}>
                        {props.labelEmpty !== undefined
                            ? characterLength() > 0
                                ? props.label
                                : props.labelEmpty
                            : props.label}
                    </span>
                </div>
                {props.trailingIcon && (
                    <UKIcon onClick={props.trailingIcon.onClick} class={styles.trailingIcon}>
                        {props.trailingIcon.icon}
                    </UKIcon>
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
