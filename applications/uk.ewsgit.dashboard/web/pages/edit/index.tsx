import CHEVRON_LEFT from "@material-symbols/svg-700/outlined/chevron_left.svg";
import UKButton from "@onlineworkspace/uikit-solid/src/components/button/UKButton.jsx";
import UKCard from "@onlineworkspace/uikit-solid/src/components/card/UKCard.jsx";
import UKDivider from "@onlineworkspace/uikit-solid/src/components/divider/UKDivider.jsx";
import UKIconButton from "@onlineworkspace/uikit-solid/src/components/iconButton/UKIconButton.jsx";
import UKText from "@onlineworkspace/uikit-solid/src/components/text/UKText.jsx";
import { useNavigate } from "@solidjs/router";
import { closestCenter, createSortable, DragDropProvider, DragDropSensors, DragOverlay, SortableProvider } from "@thisbeyond/solid-dnd";
import { type Component, createSignal, For, Show, Suspense } from "solid-js";
import Widgets from "../../widgets/widgets";
import styles from "./index.module.scss";

const Sortable: Component<{ id: string }> = (props) => {
  const sortable = createSortable(props.id);
  const Widget = Widgets[props.id as keyof typeof Widgets];

  return (
    <Show
      when={Widget}
      fallback={
        <UKText role="body" size="l">
          Invalid '{props.id}'
        </UKText>
      }
    >
      {/*@ts-ignore*/}
      <Widget use:sortable classList={{ [styles.dragging]: sortable.isActiveDraggable }} />
    </Show>
  );
};

const EditWidgets: Component = () => {
  const navigate = useNavigate();
  const [items, setItems] = createSignal<string[]>(["weather", "user.profile", "user.avatar"]);
  const [activeItem, setActiveItem] = createSignal<string | null>(null);

  const onDragStart = ({ draggable }) => setActiveItem(draggable.id);

  const onDragEnd = ({ draggable, droppable }) => {
    if (draggable && droppable && draggable.id !== droppable.id) {
      const currentItems = [...items()];
      const fromIndex = currentItems.indexOf(draggable.id);
      const toIndex = currentItems.indexOf(droppable.id);

      const updatedItems = currentItems.slice();
      updatedItems.splice(toIndex, 0, ...updatedItems.splice(fromIndex, 1));
      setItems(updatedItems);
    }
    setActiveItem(null);
  };

  return (
    <div class={styles.page}>
      <DragDropProvider onDragStart={onDragStart} onDragEnd={onDragEnd} collisionDetector={closestCenter}>
        <DragDropSensors />

        <UKButton class={styles.backButton} leadingIcon={CHEVRON_LEFT} onClick={() => navigate("/app/uk.ewsgit.dashboard")} color="filled">
          Confirm Changes
        </UKButton>

        <div class={styles.widgets}>
          <SortableProvider ids={items()}>
            <Suspense>
              <For each={items()}>
                {(widgetId) => {
                  return <Sortable id={widgetId} />;
                }}
              </For>
            </Suspense>
          </SortableProvider>
        </div>

        <DragOverlay>
          <Suspense>
            <Show when={activeItem()}>
              {(id) => {
                const Widget = Widgets[id() as keyof typeof Widgets];
                return (
                  <div class={styles.overlayItem}>
                    <Widget />
                  </div>
                );
              }}
            </Show>
          </Suspense>
        </DragOverlay>

        <UKCard class={styles.drawer} color="outlined">
          <UKText role="title" size="l">
            Widgets
          </UKText>
          <UKDivider direction="horizontal" />
          <div>
            {Object.keys(Widgets).map((widgetId) => (
              <div>
                <UKText role="body" size="m">
                  {/* TODO: display the widgets but using sample placeholder data */}
                  {widgetId}
                </UKText>
              </div>
            ))}
          </div>
        </UKCard>
      </DragDropProvider>
    </div>
  );
};

export default EditWidgets;
