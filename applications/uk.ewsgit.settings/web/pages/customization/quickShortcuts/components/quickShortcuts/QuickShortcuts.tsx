import DRAG_INDICATOR_ICON from "@material-symbols/svg-700/outlined/drag_indicator.svg";
import REMOVE_ICON from "@material-symbols/svg-700/outlined/remove.svg";
import UKIconButton from "@ewsgit/uikit-solid/src/components/iconButton/UKIconButton.jsx";
import UKStackItem from "@ewsgit/uikit-solid/src/components/stack/UKStackItem.jsx";
import { closestCenter, createSortable, DragDropProvider, DragDropSensors, SortableProvider } from "@thisbeyond/solid-dnd";
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

  const onDragEnd = ({ draggable, droppable }: { draggable: { id: string }; droppable: { id: string } | null }) => {
    if (!draggable || !droppable || draggable.id === droppable.id) {
      return;
    }

    const currentItems = [...items()];
    const fromIndex = currentItems.indexOf(draggable.id);
    const toIndex = currentItems.indexOf(droppable.id);

    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
      return;
    }

    const updatedItems = currentItems.slice();
    updatedItems.splice(toIndex, 0, ...updatedItems.splice(fromIndex, 1));

    setItems(updatedItems);
    props.setShortcuts(updatedItems);
  };

  return (
    // @ts-ignore
    <DragDropProvider onDragEnd={onDragEnd} collisionDetector={closestCenter}>
      <DragDropSensors />
      <SortableProvider ids={items()}>
        <For each={items()}>
          {(quickShortcut) => {
            const sortable = createSortable(quickShortcut);
            return (
              // @ts-ignore
              <div use:sortable classList={{ [styles.sortable]: true, [styles.dragging]: sortable.isActiveDraggable, [styles.item]: true }}>
                <UKStackItem
                  leading={{ type: "icon", value: DRAG_INDICATOR_ICON }}
                  labelText={quickShortcut.split(".").slice(2).join(" ") ?? quickShortcut}
                  supportingText={quickShortcut}
                  inlineComponent={
                    <div class={styles.itemInline}>
                      <UKIconButton
                        icon={REMOVE_ICON}
                        alt="remove item"
                        color="tonal"
                        onClick={() => {
                          const ims = items();
                          const updated = ims.filter((i) => i !== quickShortcut);
                          setItems(updated);
                          props.setShortcuts(updated);
                        }}
                      />
                    </div>
                  }
                />
              </div>
            );
          }}
        </For>
      </SortableProvider>
    </DragDropProvider>
  );
};

export default QuickShortcuts;
