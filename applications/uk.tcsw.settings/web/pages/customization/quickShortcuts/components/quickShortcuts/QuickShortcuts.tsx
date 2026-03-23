import ARROW_DOWNWARD_ICON from "@material-symbols/svg-700/outlined/arrow_downward.svg";
import ARROW_UPWARD_ICON from "@material-symbols/svg-700/outlined/arrow_upward.svg";
import REMOVE_ICON from "@material-symbols/svg-700/outlined/remove.svg";
import UKIconButton from "@tcsw/uikit-solid/src/components/iconButton/UKIconButton.jsx";
import UKStackItem from "@tcsw/uikit-solid/src/components/stack/UKStackItem.jsx";
import { type Component, createEffect, createSignal, For } from "solid-js";
import styles from "./QuickShortcuts.module.scss";

const QuickShortcuts: Component<{
  defaultValue: string[];
  currentValue: string[] | undefined;
  setShortcuts: (shortcuts: string[]) => void;
}> = (props) => {
  const [items, setItems] = createSignal<string[]>(props.currentValue ?? props.defaultValue);

  createEffect(() => {
    if (props.currentValue) {
      if (props.currentValue !== items()) setItems(props.currentValue);
    }
  });

  return (
    <For each={items()}>
      {(quickShortcut) => {
        return (
          <UKStackItem
            labelText={quickShortcut.split(".").slice(2).join(" ") ?? quickShortcut}
            supportingText={quickShortcut}
            inlineComponent={
              <div class={styles.item}>
                <UKIconButton
                  icon={REMOVE_ICON}
                  alt="remove item"
                  color="tonal"
                  onClick={() => {
                    const ims = items();
                    props.setShortcuts(ims.filter((i) => i !== quickShortcut));
                  }}
                />
                {items().indexOf(quickShortcut) < items().length - 1 && (
                  <UKIconButton
                    color="tonal"
                    alt="Move item down"
                    onClick={() => {
                      const ims = items();
                      const index = ims.indexOf(quickShortcut);
                      if (index === -1 || index === ims.length - 1) return ims;
                      const newItems = [...ims];
                      [newItems[index + 1], newItems[index]] = [
                        newItems[index],
                        newItems[index + 1],
                      ];
                      props.setShortcuts(newItems);
                    }}
                    icon={ARROW_DOWNWARD_ICON}
                  ></UKIconButton>
                )}
                {items().indexOf(quickShortcut) > 0 && (
                  <UKIconButton
                    color="tonal"
                    alt="Move item up"
                    onClick={() => {
                      const ims = items();
                      const index = ims.indexOf(quickShortcut);
                      if (index === -1 || index === 0) return ims;
                      const newItems = [...ims];
                      [newItems[index - 1], newItems[index]] = [
                        newItems[index],
                        newItems[index - 1],
                      ];
                      props.setShortcuts(newItems);
                    }}
                    icon={ARROW_UPWARD_ICON}
                  ></UKIconButton>
                )}
              </div>
            }
          />
        );
      }}
    </For>
  );
};

export default QuickShortcuts;
