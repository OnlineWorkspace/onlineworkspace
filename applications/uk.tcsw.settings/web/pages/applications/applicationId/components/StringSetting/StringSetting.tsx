import RESET_WRENCH_ICON from "@material-symbols/svg-700/outlined/reset_wrench.svg";
import { useParams } from "@solidjs/router";
import UKStackItem from "@tcsw/uikit-solid/src/components/stack/UKStackItem.jsx";
import UKTextField from "@tcsw/uikit-solid/src/components/textField/UKTextField.tsx";
import { type Component, createEffect, createSignal } from "solid-js";
import trpc from "../../../../../lib/trpc.ts";
import styles from "./StringSetting.module.scss";

const StringSetting: Component<{
  displayName: string;
  id: string;
  defaultValue: string;
  currentValue: string | undefined;
  description: string;
}> = (props) => {
  const params = useParams();
  const [value, setValue] = createSignal(props.currentValue ?? props.defaultValue);

  createEffect(async () => {
    if (!params.applicationId) return;

    await trpc.application.setApplicationStringSettingValue.mutate({
      applicationId: params.applicationId as string,
      id: props.id,
      value: value().toString(),
    });
  });

  return (
    <UKStackItem
      labelText={`${props.displayName} (${props.id})`}
      supportingText={props.description}
      leading={
        value() !== props.defaultValue
          ? {
              type: "iconButton",
              alt: "Reset settings to the default value",
              value: RESET_WRENCH_ICON,
              onClick() {
                setValue(props.defaultValue);
              },
            }
          : undefined
      }
      inlineComponent={
        <UKTextField
          containerClass={styles.textField}
          color={"filled"}
          label={"Value"}
          getValue={setValue}
          setValue={value()}
          defaultValue={props.currentValue ?? props.defaultValue}
        />
      }
    />
  );
};

export default StringSetting;
