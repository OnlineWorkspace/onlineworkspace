import UKStackItem from "@tcsw/uikit-solid/src/components/stack/UKStackItem.jsx";
import UKSwitch from "@tcsw/uikit-solid/src/components/switch/UKSwitch.jsx";
import { createEffect, createSignal, type Component } from "solid-js";
import trpc from "../../../../../lib/trpc.ts";
import { useParams } from "@solidjs/router";

const BooleanSetting: Component<{ displayName: string; id: string; defaultValue: boolean; currentValue: boolean }> = (
    props,
) => {
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
