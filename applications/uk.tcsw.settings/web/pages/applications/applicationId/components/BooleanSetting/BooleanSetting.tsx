import { useParams } from "@solidjs/router";
import UKStackItem from "@tcsw/uikit-solid/src/components/stack/UKStackItem.jsx";
import UKSwitch from "@tcsw/uikit-solid/src/components/switch/UKSwitch.jsx";
import { type Component, createEffect, createSignal } from "solid-js";
import trpc from "../../../../../lib/trpc.ts";
import styles from "./BooleanSetting.module.scss";

const BooleanSetting: Component<{
  displayName: string;
  id: string;
  defaultValue: boolean;
  currentValue: boolean;
  description: string;
}> = (props) => {
  const params = useParams();
  const [value, setValue] = createSignal(props.currentValue ?? props.defaultValue);

  createEffect(async () => {
    if (!params.applicationId) return;

    await trpc.application.setApplicationBooleanSettingValue.mutate({
      applicationId: params.applicationId as string,
      id: props.id,
      value: value(),
    });
  });

  return (
    <UKStackItem
      labelText={`${props.displayName}`}
      supportingText={props.description}
      inlineComponent={
        <>
          <UKSwitch class={styles.switch} onValueChange={setValue} value={value()} />
        </>
      }
    />
  );
};

export default BooleanSetting;
