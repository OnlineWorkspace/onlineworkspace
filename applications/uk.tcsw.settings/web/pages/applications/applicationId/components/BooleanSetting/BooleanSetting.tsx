import UKStackItem from "@tcsw/uikit-solid/src/components/stack/UKStackItem.jsx";
import UKSwitch from "@tcsw/uikit-solid/src/components/switch/UKSwitch.jsx";
import { createEffect, createSignal, type Component } from "solid-js";
import trpc from "../../../../../lib/trpc.ts";
import { useParams } from "@solidjs/router";
import styles from "./BooleanSetting.module.scss";

const BooleanSetting: Component<{ displayName: string; id: string; defaultValue: boolean; currentValue: boolean }> = (
    props,
) => {
    const params = useParams();
    const [value, setValue] = createSignal(props.currentValue ?? props.defaultValue);

    createEffect(async () => {
        if (!params.applicationId) return;

        await trpc.application.setAppicationBooleanSettingValue.mutate({
            applicationId: params.applicationId as string,
            id: props.id,
            value: value(),
        });
    });

    return (
        <UKStackItem
            labelText={props.displayName}
            supportingText={props.id}
            inlineComponent={
                <>
                    <UKSwitch class={styles.switch} getValue={setValue} value={value()} />
                </>
            }
        />
    );
};

export default BooleanSetting;
