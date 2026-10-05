import {type Component, createSignal, For, onMount} from "solid-js";
import clsx from "clsx";
import styles from "./OtpInput.module.scss";

const OTP_LENGTH = 6;

/**
 * Six-box one-time-code input. A single real `<input>` sits invisibly over the boxes so
 * typing, pasting and browser/mobile autofill (`one-time-code`) all behave natively.
 */
const OtpInput: Component<{
    onComplete: (code: string) => void;
    onChange?: (code: string) => void;
    label?: string;
    error?: boolean;
    disabled?: boolean;
    class?: string;
}> = (props) => {
    const [value, setValue] = createSignal("");
    const [focused, setFocused] = createSignal(false);
    let inputRef!: HTMLInputElement;

    onMount(() => inputRef.focus());

    const update = (raw: string) => {
        const digits = raw.replace(/\D/g, "").slice(0, OTP_LENGTH);
        setValue(digits);
        inputRef.value = digits;
        props.onChange?.(digits);

        if (digits.length === OTP_LENGTH) props.onComplete(digits);
    };

    return <div class={clsx(styles.root, props.class)}>
        <div
            class={styles.boxes}
            data-error={props.error || false}
            data-disabled={props.disabled || false}
            onClick={() => inputRef.focus()}
        >
            <For each={Array.from({length: OTP_LENGTH})}>
                {(_, index) => <div
                    class={styles.box}
                    data-active={focused() && !props.disabled && Math.min(value().length, OTP_LENGTH - 1) === index()}
                    data-filled={index() < value().length}
                >
                    {value()[index()] ?? ""}
                </div>}
            </For>
            <input
                ref={inputRef}
                class={styles.input}
                type={"text"}
                inputmode={"numeric"}
                pattern={"[0-9]*"}
                autocomplete={"one-time-code"}
                maxLength={OTP_LENGTH}
                aria-label={props.label ?? "Two factor code"}
                aria-invalid={props.error || false}
                disabled={props.disabled}
                onInput={e => update(e.currentTarget.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
            />
        </div>
    </div>
}

export default OtpInput;
