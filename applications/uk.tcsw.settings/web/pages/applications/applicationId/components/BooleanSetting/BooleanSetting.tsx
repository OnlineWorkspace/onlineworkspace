import UKStackItem from "@tcsw/uikit-solid/src/components/stack/UKStackItem.jsx";
import UKSwitch from "@tcsw/uikit-solid/src/components/switch/UKSwitch.jsx";
import { createEffect, createSignal, type Component } from "solid-js";
import trpc from "../../../../../lib/trpc.ts";

const BooleanSetting: Component<{ displayName: string; id: string; defaultValue: boolean; currentValue: boolean }> = (
    props,
) => {
    const [value, setValue] = createSignal(props.defaultValue);

    createEffect(async () => {
        await trpc.application.setSettingValue.mutate(value);
    });

    return (
        <UKStackItem
            labelText={props.displayName}
            supportingText={props.id}
            inlineComponent={
                <>
                    <UKSwitch getValue={setValue} value={value()} />
                </>
            }
        />
    );
};

export default BooleanSetting;
