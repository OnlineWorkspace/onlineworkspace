import UKStackItem from "@tcsw/uikit-solid/src/components/stack/UKStackItem.jsx";
import { type Component, createEffect, createSignal, For } from "solid-js";
import styles from "./QuickShortcuts.module.scss";
import UKIconButton from "@tcsw/uikit-solid/src/components/iconButton/UKIconButton.jsx";

const QuickShortcuts: Component<{
  defaultValue: string[];
  currentValue: string[] | undefined;
  setShortcuts: (shortcuts: string[]) => void;
}> = (props) => {
  const [items, setItems] = createSignal<string[]>(
    props.currentValue ?? props.defaultValue,
  );

  createEffect(() => {
    if (props.currentValue) {
      if (props.currentValue !== items()) setItems(props.currentValue);
    }
  });

  return (
    <For each={items()}>
      {(quickShortcut) => {
        return (
          <>
            <UKStackItem
              labelText={
                quickShortcut.split(".").slice(2).join(" ") ?? quickShortcut
              }
              supportingText={quickShortcut}
              inlineComponent={
                <div class={styles.item}>
                  <UKIconButton
                    icon="remove"
                    alt="remove item"
                    color="tonal"
                    onClick={() => {
                      const ims = items();
                      props.setShortcuts(
                        ims.filter((i) => i !== quickShortcut),
                      );
                    }}
                  />
                  {items().indexOf(quickShortcut) < items().length - 1 && (
                    <UKIconButton
                      color="tonal"
                      alt="Move item down"
                      onClick={() => {
                        const ims = items();
                        const index = ims.indexOf(quickShortcut);
                        if (index === -1 || index === ims.length - 1)
                          return ims;
                        const newItems = [...ims];
                        [newItems[index + 1], newItems[index]] = [
                          newItems[index],
                          newItems[index + 1],
                        ];
                        props.setShortcuts(newItems);
                      }}
                      icon="arrow_downward"
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
                      icon="arrow_upward"
                    ></UKIconButton>
                  )}
                </div>
              }
            />
          </>
        );
      }}
    </For>
  );
};

export default QuickShortcuts;
