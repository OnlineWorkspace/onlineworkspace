import UKStackItem from "@ewsgit/uikit-solid/src/components/stack/UKStackItem.tsx";
import UKSwitch from "@ewsgit/uikit-solid/src/components/switch/UKSwitch.tsx";
import { useParams } from "@solidjs/router";
import { type Component, createEffect, createSignal } from "solid-js";
import trpc from "../../../../../lib/trpc.ts";
import styles from "./BooleanSetting.module.scss";

const BooleanSetting: Component<{
  displayName: string;
  id: string;
  defaultValue: boolean;
  currentValue: boolean;
  description: string;
  // an instance-wide setting, which only administrators can change
  global?: boolean;
}> = (props) => {
  const params = useParams();
  const [value, setValue] = createSignal(props.currentValue ?? props.defaultValue);

  let first = true;

  createEffect(async () => {
    const current = value();

    // an instance-wide setting is only written when it is changed, not when the page first shows it
    if (props.global && first) {
      first = false;
      return;
    }

    if (!params.applicationId) return;

    const input = { applicationId: params.applicationId as string, id: props.id, value: current };

    if (props.global) await trpc.application.setApplicationGlobalBooleanSettingValue.mutate(input);
    else await trpc.application.setApplicationBooleanSettingValue.mutate(input);
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
