import UKStackItem from "@tcsw/uikit-solid/src/components/stack/UKStackItem.jsx";
import { createEffect, createSignal, For, type Component } from "solid-js";
import trpc from "../../../../../lib/trpc.ts";
import { useParams } from "@solidjs/router";
import UKTextField from "@tcsw/uikit-solid/src/components/textField/UKTextField.tsx";
import styles from "./StringListSetting.module.scss";
import UKButton from "@tcsw/uikit-solid/src/components/button/UKButton.jsx";
import UKIconButton from "@tcsw/uikit-solid/src/components/iconButton/UKIconButton.jsx";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.jsx";

const StringListSetting: Component<{
    displayName: string;
    id: string;
    defaultValue: string[];
    currentValue: string[] | undefined;
    description: string;
}> = (props) => {
    const params = useParams();
    const [inputValue, setInputValue] = createSignal<string>("");
    const [items, setItems] = createSignal<string[]>(props.currentValue ?? props.defaultValue);

    createEffect(async () => {
        if (!params.applicationId) return;

        await trpc.application.setApplicationStringListSettingValue.mutate({
            applicationId: params.applicationId as string,
            id: props.id,
            value: items(),
        });
    });

    return (
        <UKStackItem
            labelText={`${props.displayName} (${props.id})`}
            supportingText={props.description}
            leading={
                items() !== props.defaultValue
                    ? {
                          type: "iconButton",
                          alt: "Reset settings to the default value",
                          value: "reset_wrench",
                          onClick() {
                              setItems(props.defaultValue);
                          },
                      }
                    : undefined
            }
            expandedComponent={
                <>
                    <div class={styles.inputContainer}>
                        <UKTextField
                            containerClass={styles.textField}
                            color={"outlined"}
                            label={"Value"}
                            getValue={setInputValue}
                            defaultValue={inputValue()}
                        />
                        <UKButton
                            size="m"
                            onClick={() => {
                                setItems((ims) => [...ims, inputValue()]);
                                setInputValue("");
                            }}
                        >
                            Add
                        </UKButton>
                    </div>
                    <For each={items()}>
                        {(item) => {
                            return (
                                <div class={styles.item}>
                                    <UKIconButton
                                        icon="remove"
                                        alt="remove item"
                                        color="tonal"
                                        onClick={() => {
                                            setItems((ims) => ims.filter((i) => i !== item));
                                        }}
                                    />
                                    <UKText role="body" size="l" class={styles.itemLabel}>
                                        {item}
                                    </UKText>
                                </div>
                            );
                        }}
                    </For>
                </>
            }
        />
    );
};

export default StringListSetting;
