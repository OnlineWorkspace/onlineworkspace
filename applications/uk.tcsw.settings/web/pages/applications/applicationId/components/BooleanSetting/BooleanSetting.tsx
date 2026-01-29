import UKStackItem from "@tcsw/uikit-solid/src/components/stack/UKStackItem.jsx";
import UKSwitch from "@tcsw/uikit-solid/src/components/switch/UKSwitch.jsx";
import { createSignal, type Component } from "solid-js";

const BooleanSetting: Component<{ displayName: string; id: string; defaultValue: boolean; currentValue: boolean }> = (
    props,
) => {
    const [value, setValue] = createSignal(props.defaultValue);

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
