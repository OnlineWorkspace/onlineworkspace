import CHEVRON_LEFT from "@material-symbols/svg-700/outlined/chevron_left.svg";
import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.jsx";
import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.jsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.jsx";
import { useNavigate } from "@solidjs/router";
import { closestCenter, createSortable, DragDropProvider, DragDropSensors, SortableProvider } from "@thisbeyond/solid-dnd";
import { type Component, createSignal, For, Show, Suspense } from "solid-js";
import Widgets from "../../widgets/widgets";
import styles from "./index.module.scss";

interface WidgetInstance {
  id: string;
  type: string;
}

const generateInstanceId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

const DraggableWidget: Component<{ instance: WidgetInstance }> = (props) => {
  const sortable = createSortable(props.instance.id);
  const WidgetComponent = Widgets[props.instance.type as keyof typeof Widgets];

  return (
    <Show
      when={WidgetComponent}
      fallback={
        <UKText role="body" size="l">
          Invalid '{props.instance.type}'
        </UKText>
      }
    >
      <div
        /* @ts-ignore */
        use:sortable
        classList={{
          [styles.dragging]: sortable.isActiveDraggable,
        }}
      >
        {/*@ts-ignore*/}
        <WidgetComponent />
      </div>
    </Show>
  );
};

const EditWidgets: Component = () => {
  const navigate = useNavigate();
  const [items, setItems] = createSignal<WidgetInstance[]>([
    { id: generateInstanceId(), type: "weather" },
    { id: generateInstanceId(), type: "user.profile" },
    { id: generateInstanceId(), type: "user.avatar" },
  ]);

  const [activeDraggableId, setActiveDraggableId] = createSignal<string | null>(null);

  const allWidgetTypes = Object.keys(Widgets);
  const allInstanceIds = () => items().map((w) => w.id);
  const allDraggableIds = () => [...allInstanceIds(), ...allWidgetTypes];

  const onDragStart = ({ draggable }) => {
    setActiveDraggableId(draggable.id);
  };

  const onDragEnd = ({ draggable, droppable }: { draggable: { id: string }; droppable: { id: string } | null }) => {
    setActiveDraggableId(null);

    if (!draggable || !droppable || draggable.id === droppable.id) {
      return;
    }

    const currentItems = [...items()];
    const fromIndex = currentItems.findIndex((w) => w.id === draggable.id);
    const toIndex = currentItems.findIndex((w) => w.id === droppable.id);

    if (fromIndex === -1 && allWidgetTypes.includes(draggable.id)) {
      const newWidget: WidgetInstance = {
        id: generateInstanceId(),
        type: draggable.id,
      };

      if (toIndex !== -1) {
        currentItems.splice(toIndex, 0, newWidget);
      } else {
        currentItems.push(newWidget);
      }
      setItems(currentItems);
      return;
    }

    if (toIndex === -1 || fromIndex === toIndex) {
      return;
    }

    const updatedItems = currentItems.slice();
    updatedItems.splice(toIndex, 0, ...updatedItems.splice(fromIndex, 1));
    setItems(updatedItems);
  };

  return (
    <div class={styles.page}>
      {/* @ts-ignore */}
      <DragDropProvider onDragStart={onDragStart} onDragEnd={onDragEnd} collisionDetector={closestCenter}>
        <DragDropSensors />

        <UKButton class={styles.backButton} leadingIcon={CHEVRON_LEFT} onClick={() => navigate("/app/uk.ewsgit.dashboard")} color="filled">
          Confirm Changes
        </UKButton>

        <SortableProvider ids={allDraggableIds()}>
          <div class={styles.widgets} classList={{ [styles.draggingActive]: activeDraggableId() !== null }}>
            <Suspense>
              <For each={items()}>
                {(widget) => {
                  return <DraggableWidget instance={widget} />;
                }}
              </For>
            </Suspense>
          </div>

          <UKCard class={styles.drawer} color="outlined">
            <UKText role="title" size="s">
              Widgets
            </UKText>
            <div class={styles.widgetGrid}>
              <For each={allWidgetTypes}>
                {(widgetType) => {
                  const WidgetComponent = Widgets[widgetType as keyof typeof Widgets];
                  const sortable = createSortable(widgetType);

                  if (!WidgetComponent)
                    return (
                      <UKText role={"body"} size="l" align={"center"} emphasized>
                        Invalid WidgetId '{widgetType}'
                      </UKText>
                    );

                  return (
                    <div
                      /* @ts-ignore */
                      use:sortable
                      classList={{
                        [styles.dragging]: sortable.isActiveDraggable,
                      }}
                    >
                      {/*@ts-ignore*/}
                      <WidgetComponent />
                    </div>
                  );
                }}
              </For>
            </div>
          </UKCard>
        </SortableProvider>
      </DragDropProvider>
    </div>
  );
};

export default EditWidgets;
