import UKStackItem from "@tcsw/uikit-solid/src/components/stack/UKStackItem.jsx";
import { createEffect, createSignal, type Component } from "solid-js";
import trpc from "../../../../../lib/trpc.ts";
import { useParams } from "@solidjs/router";
import UKTextField from "@tcsw/uikit-solid/src/components/textField/UKTextField.tsx";
import styles from "./StringSetting.module.scss";

const StringSetting: Component<{
    displayName: string;
    id: string;
    defaultValue: string;
    currentValue: string | undefined;
}> = (props) => {
    const params = useParams();
    const [value, setValue] = createSignal(props.currentValue ?? props.defaultValue);

    createEffect(async () => {
        if (!params.applicationId) return;

        await trpc.application.setApplicationSettingValue.mutate({
            applicationId: params.applicationId as string,
            id: props.id,
            value: value().toString(),
        });
    });

    console.log(value() !== props.defaultValue);

    return (
        <UKStackItem
            labelText={props.displayName}
            supportingText={props.id}
            leading={
                value() !== props.defaultValue
                    ? {
                          type: "iconButton",
                          alt: "Reset settings to the default value",
                          value: "reset_wrench",
                          onClick() {
                              setValue(props.defaultValue);
                          },
                      }
                    : undefined
            }
            inlineComponent={
                <>
                    <UKTextField
                        containerClass={styles.textField}
                        color={"filled"}
                        label={"Value"}
                        getValue={setValue}
                        defaultValue={props.currentValue ?? props.defaultValue}
                    />
                </>
            }
        />
    );
};

export default StringSetting;
