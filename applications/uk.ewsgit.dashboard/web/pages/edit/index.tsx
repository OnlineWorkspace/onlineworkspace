import ADD_ICON from "@material-symbols/svg-700/outlined/add.svg";
import CHECK_ICON from "@material-symbols/svg-700/outlined/check.svg";
import CLOSE_ICON from "@material-symbols/svg-700/outlined/close.svg";
import SETTINGS_ICON from "@material-symbols/svg-700/outlined/settings.svg";
import DRAG_INDICATOR_ICON from "@material-symbols/svg-700/outlined/drag_indicator.svg";
import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKButtonGroup from "@ewsgit/uikit-solid/src/components/buttonGroup/UKButtonGroup.tsx";
import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.tsx";
import UKDialog from "@ewsgit/uikit-solid/src/components/dialog/UKDialog.tsx";
import UKIcon from "@ewsgit/uikit-solid/src/components/icon/UKIcon.tsx";
import UKIconButton from "@ewsgit/uikit-solid/src/components/iconButton/UKIconButton.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import UKTextField from "@ewsgit/uikit-solid/src/components/textField/UKTextField.tsx";
import { useNavigate } from "@solidjs/router";
import {
  closestCenter,
  createDraggable,
  createDroppable,
  createSortable,
  type DragEventHandler,
  DragDropProvider,
  DragDropSensors,
  DragOverlay,
  SortableProvider,
} from "@thisbeyond/solid-dnd";
import { type Component, createEffect, createResource, createSignal, For, on, onCleanup, Show, Suspense } from "solid-js";
import trpc from "../../lib/trpc";
import DashboardHeader from "../root/Header";
import rootStyles from "../root/index.module.scss";
import Widgets, {
  defaultWidgetSize,
  missingRequiredSetting,
  parseWidgetEntry,
  serialiseWidgetEntry,
  sizeLabel,
  type WidgetInfo,
  WidgetInfos,
  type WidgetSettings,
  type WidgetSize,
  type WidgetType,
} from "../../widgets/widgets";
import frameStyles from "../../widgets/WidgetFrame.module.scss";
import styles from "./index.module.scss";

declare module "solid-js" {
  namespace JSX {
    interface Directives {
      sortable: true;
      draggable: true;
    }
  }
}

interface WidgetInstance {
  id: string;
  type: string;
  size: WidgetSize;
  settings: WidgetSettings;
}

const PALETTE_PREFIX = "palette:";
const END_SLOT_ID = "end-slot";
const SAVE_DEBOUNCE_MS = 500;

const generateInstanceId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

/**
 * The drag overlay is portalled to <body>, outside the UIKit root, so it loses the theme variables (colours, typography)
 * that are scoped to the root by generated `uk<number>` classes. Giving the overlay those classes restores them.
 */
const uikitThemeClasses = () =>
  [...(document.querySelector("[data-uikit-root]")?.classList ?? [])].filter((c) => /^uk\d+$/.test(c)).join(" ");

const infoFor = (type: string): WidgetInfo | undefined => WidgetInfos[type as WidgetType];

const CanvasWidget: Component<{ instance: WidgetInstance; onRemove: () => void; onResize: (size: WidgetSize) => void; onOpenSettings: () => void }> = (props) => {
  const sortable = createSortable(props.instance.id);
  const WidgetComponent = Widgets[props.instance.type as WidgetType];
  const info = () => infoFor(props.instance.type);

  return (
    <div
      // @ts-ignore solid-dnd directive
      use:sortable
      class={`${frameStyles.frame} ${styles.widget}`}
      classList={{
        [styles.dragging]: sortable.isActiveDraggable,
        [styles.dropTarget]: sortable.isActiveDroppable && !sortable.isActiveDraggable,
      }}
      style={{ "--cols": props.instance.size.cols, "--rows": props.instance.size.rows }}
    >
      <div class={styles.widgetContent}>
        <Show
          when={WidgetComponent}
          fallback={
            <UKCard>
              <UKText role="body" size="l">
                Unknown widget '{props.instance.type}'
              </UKText>
            </UKCard>
          }
        >
          <Suspense>
            {/*@ts-ignore*/}
            <WidgetComponent size={props.instance.size} settings={props.instance.settings} />
          </Suspense>
        </Show>
      </div>
      <div class={styles.widgetControls}>
        <div class={styles.grip}>
          <UKIcon>{DRAG_INDICATOR_ICON}</UKIcon>
          <UKText role="label" size="m">
            {info()?.label ?? props.instance.type}
          </UKText>
        </div>
        {/* the pointer-down is stopped so pressing these can't start a drag */}
        <div class={styles.controlActions} onPointerDown={(e) => e.stopPropagation()}>
          <Show when={(info()?.sizes.length ?? 0) > 1}>
            <div class={styles.sizes} role="group" aria-label="Widget size">
              <For each={info()?.sizes}>
                {(size) => (
                  <button
                    type="button"
                    class={styles.sizeChip}
                    data-selected={size.cols === props.instance.size.cols && size.rows === props.instance.size.rows}
                    onClick={() => props.onResize(size)}
                  >
                    {sizeLabel(size)}
                  </button>
                )}
              </For>
            </div>
          </Show>
          <Show when={(info()?.settings?.length ?? 0) > 0}>
            <UKIconButton size="xs" color="tonal" icon={SETTINGS_ICON} alt={`${info()?.label ?? "Widget"} settings`} onClick={props.onOpenSettings} />
          </Show>
          <UKIconButton size="xs" color="tonal" icon={CLOSE_ICON} alt={`Remove ${info()?.label ?? "widget"}`} onClick={props.onRemove} />
        </div>
      </div>
    </div>
  );
};

const PaletteTile: Component<{ type: string; onAdd: () => void }> = (props) => {
  const draggable = createDraggable(`${PALETTE_PREFIX}${props.type}`);
  const info = () => infoFor(props.type);

  return (
    <div
      // @ts-ignore solid-dnd directive
      use:draggable
      class={styles.paletteTile}
      classList={{ [styles.dragging]: draggable.isActiveDraggable }}
    >
      <div class={styles.paletteIcon}>
        <UKIcon>{info()?.icon ?? ADD_ICON}</UKIcon>
      </div>
      <div class={styles.paletteText}>
        <UKText role="title" size="s">
          {info()?.label ?? props.type}
        </UKText>
        <UKText role="body" size="s" class={styles.muted}>
          {info()?.description ?? ""}
        </UKText>
      </div>
      <div onPointerDown={(e) => e.stopPropagation()}>
        <UKIconButton size="xs" color="tonal" icon={ADD_ICON} alt={`Add ${info()?.label ?? props.type}`} onClick={props.onAdd} />
      </div>
    </div>
  );
};

const EndSlot: Component<{ empty: boolean }> = (props) => {
  const droppable = createDroppable(END_SLOT_ID);

  return (
    <div
      // @ts-ignore solid-dnd directive
      use:droppable
      class={styles.endSlot}
      classList={{ [styles.dropTarget]: droppable.isActiveDroppable, [styles.endSlotEmpty]: props.empty }}
    >
      <UKIcon>{ADD_ICON}</UKIcon>
      <UKText role="label" size="l">
        {props.empty ? "Drag a widget here to get started" : "Drop here to add to the end"}
      </UKText>
    </div>
  );
};

const SettingsDialog: Component<{ widget: WidgetInstance | undefined; onSave: (settings: WidgetSettings) => void; onClose: () => void }> = (props) => {
  const [draft, setDraft] = createSignal<WidgetSettings>({});
  const info = () => (props.widget ? infoFor(props.widget.type) : undefined);
  const canSave = () => !props.widget || !missingRequiredSetting(props.widget.type, draft());

  // each time the dialog opens for a widget, start from that widget's current settings
  createEffect(on(() => props.widget?.id, () => setDraft({ ...props.widget?.settings })));

  const save = () => {
    if (canSave()) props.onSave(draft());
  };

  return (
    <UKDialog show={() => props.widget !== undefined} onClose={props.onClose} maxWidth="28rem">
      <div class={styles.settingsDialog}>
        <UKText role="title" size="l" align="start">
          {info()?.label} settings
        </UKText>
        <For each={info()?.settings}>
          {(field) => (
            <div class={styles.settingsField}>
              <UKTextField
                color="outlined"
                label={field.required ? `${field.label} *` : field.label}
                labelEmpty={field.placeholder}
                value={draft()[field.key] ?? ""}
                defaultValue={draft()[field.key] ?? ""}
                onValueChange={(value) => setDraft((current) => ({ ...current, [field.key]: value }))}
                onSubmit={save}
                onEscape={props.onClose}
              />
              <Show when={field.description}>
                <UKText role="body" size="s" align="start" class={styles.muted}>
                  {field.description}
                </UKText>
              </Show>
            </div>
          )}
        </For>
        <UKButtonGroup size="m" align="end">
          <UKButton color="standard" onClick={props.onClose}>
            Cancel
          </UKButton>
          <UKButton color="filled" disabled={!canSave()} onClick={save}>
            Save
          </UKButton>
        </UKButtonGroup>
      </div>
    </UKDialog>
  );
};

const EditWidgets: Component = () => {
  const navigate = useNavigate();
  const [savedWidgets] = createResource(() => trpc.dashboard.getWidgets.query());
  const [items, setItems] = createSignal<WidgetInstance[]>([]);
  const [loaded, setLoaded] = createSignal(false);
  const [settingsId, setSettingsId] = createSignal<string | undefined>(undefined);
  const [activeId, setActiveId] = createSignal<string | undefined>(undefined);
  const [saveState, setSaveState] = createSignal<"idle" | "saving" | "saved" | "error">("idle");

  const allWidgetTypes = Object.keys(Widgets);
  const settingsWidget = () => items().find((w) => w.id === settingsId());
  const itemIds = () => items().map((w) => w.id);
  const serialisedItems = () => items().map((w) => serialiseWidgetEntry(w.type, w.size, w.settings));
  const itemsKey = () => serialisedItems().join("\n");

  let lastSavedKey: string | undefined;
  let saveTimer: ReturnType<typeof setTimeout> | undefined;

  createEffect(() => {
    const widgets = savedWidgets();

    if (widgets === undefined || loaded()) return;

    setItems(widgets.map((entry) => ({ id: generateInstanceId(), ...parseWidgetEntry(entry) })));
    lastSavedKey = widgets.join("\n");
    setLoaded(true);
  });

  const save = async () => {
    clearTimeout(saveTimer);

    const key = itemsKey();

    if (!loaded() || key === lastSavedKey) return;

    setSaveState("saving");

    try {
      await trpc.dashboard.setWidgets.mutate(serialisedItems());
      lastSavedKey = key;
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  };

  // changes are saved shortly after the last one, so a burst of rearranging only saves once
  createEffect(
    on(itemsKey, () => {
      if (!loaded()) return;

      clearTimeout(saveTimer);
      saveTimer = setTimeout(save, SAVE_DEBOUNCE_MS);
    }),
  );
  onCleanup(() => clearTimeout(saveTimer));

  const addWidget = (type: string, atIndex?: number) => {
    const widget: WidgetInstance = { id: generateInstanceId(), type, size: defaultWidgetSize(type), settings: {} };

    setItems((current) => {
      const next = [...current];

      next.splice(atIndex ?? next.length, 0, widget);

      return next;
    });

    // a widget that can't work without a setting asks for it straight away
    if (missingRequiredSetting(type, widget.settings)) setSettingsId(widget.id);
  };

  const updateSettings = (id: string, settings: WidgetSettings) => setItems((current) => current.map((w) => (w.id === id ? { ...w, settings } : w)));

  const resizeWidget = (id: string, size: WidgetSize) => setItems((current) => current.map((w) => (w.id === id ? { ...w, size } : w)));

  const removeWidget = (id: string) => setItems((current) => current.filter((w) => w.id !== id));

  const onDragStart: DragEventHandler = ({ draggable }) => setActiveId(String(draggable.id));

  const onDragEnd: DragEventHandler = ({ draggable, droppable }) => {
    setActiveId(undefined);

    if (!draggable || !droppable) return;

    const draggableId = String(draggable.id);
    const droppableId = String(droppable.id);
    const toIndex = droppableId === END_SLOT_ID ? items().length : items().findIndex((w) => w.id === droppableId);

    if (toIndex === -1) return;

    if (draggableId.startsWith(PALETTE_PREFIX)) {
      addWidget(draggableId.slice(PALETTE_PREFIX.length), toIndex);

      return;
    }

    const fromIndex = items().findIndex((w) => w.id === draggableId);

    if (fromIndex === -1 || fromIndex === toIndex) return;

    setItems((current) => {
      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);

      // dropping on the end slot has already counted the removed item
      next.splice(droppableId === END_SLOT_ID ? next.length : toIndex, 0, moved!);

      return next;
    });
  };

  const saveStatusText = () => {
    switch (saveState()) {
      case "saving":
        return "Saving…";
      case "saved":
        return "All changes saved";
      case "error":
        return "Couldn't save your changes";
      default:
        return "Drag widgets to rearrange them";
    }
  };

  // everything is laid out exactly like the dashboard (same header, same grid classes) so widgets don't move when entering or
  // leaving the editor; the editor's own UI floats above it instead of taking up space
  return (
    <DragDropProvider onDragStart={onDragStart} onDragEnd={onDragEnd} collisionDetector={closestCenter}>
      <DragDropSensors />

      <div class={styles.toolbar}>
        <div class={styles.toolbarText}>
          <UKText role="title" size="l">
            Edit Dashboard
          </UKText>
          <UKText role="label" size="m" class={styles.status} data-error={saveState() === "error"}>
            {saveStatusText()}
          </UKText>
        </div>
        <UKButton
          leadingIcon={CHECK_ICON}
          color="filled"
          onClick={async () => {
            await save();
            navigate("/app/uk.ewsgit.dashboard");
          }}
        >
          Done
        </UKButton>
      </div>

      <div class={styles.header} inert>
        <DashboardHeader />
      </div>

      <div class={`${rootStyles.widgets} ${styles.canvas}`} data-dragging={activeId() !== undefined} data-empty={items().length === 0}>
        <Show when={loaded()}>
          <SortableProvider ids={itemIds()}>
            <For each={items()}>{(widget) => <CanvasWidget instance={widget} onOpenSettings={() => setSettingsId(widget.id)} onRemove={() => removeWidget(widget.id)} onResize={(size) => resizeWidget(widget.id, size)} />}</For>
          </SortableProvider>
          <Show when={items().length === 0 || activeId() !== undefined}>
            <EndSlot empty={items().length === 0} />
          </Show>
        </Show>
      </div>

      <UKCard class={styles.drawer} color="outlined">
        <UKText role="label" size="l">
          Add widgets
          <span class={styles.muted}> · drag onto the dashboard, or press +</span>
        </UKText>
        <div class={styles.paletteGrid}>
          <For each={allWidgetTypes}>{(type) => <PaletteTile type={type} onAdd={() => addWidget(type)} />}</For>
        </div>
      </UKCard>

      <SettingsDialog
        widget={settingsWidget()}
        onClose={() => setSettingsId(undefined)}
        onSave={(settings) => {
          updateSettings(settingsId()!, settings);
          setSettingsId(undefined);
        }}
      />

      <DragOverlay>
        {(draggable) => {
          const id = String(draggable?.id ?? "");
          const type = id.startsWith(PALETTE_PREFIX) ? id.slice(PALETTE_PREFIX.length) : items().find((w) => w.id === id)?.type;
          const info = type ? infoFor(type) : undefined;

          return (
            <div class={`${styles.overlay} ${uikitThemeClasses()}`}>
              <UKIcon>{info?.icon ?? DRAG_INDICATOR_ICON}</UKIcon>
              <UKText role="title" size="s">
                {info?.label ?? type}
              </UKText>
            </div>
          );
        }}
      </DragOverlay>
    </DragDropProvider>
  );
};

export default EditWidgets;
