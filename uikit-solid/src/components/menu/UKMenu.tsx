import clsx from "clsx";
import {type Accessor, type Component, createSignal, For} from "solid-js";
import {Portal} from "solid-js/web";
import UKDivider from "../divider/UKDivider.tsx";
import UKIcon from "../icon/UKIcon.tsx";
import UKText from "../text/UKText.tsx";
import styles from "./UKMenu.module.scss";

export type MenuItem =
  | {
    type: "button";
    leadingIcon?: string;
    label?: string;
    supportingText?: string;
    badge?: string;
    onClick(): void | Promise<void>;
    selected?: boolean;
    disabled?: boolean;
  }
  | {
    type: "category";
    leadingIcon?: string;
    supportingText?: string;
    label?: string;
    badge?: string;
    children?: MenuItem[];
    onClick?(): void;
    selected?: boolean;
    disabled?: boolean;
  }
  | {
    type: "divider";
  }
  | {
    type: "spacer";
  };

const UKMenu: Component<{
  items: (MenuItem | undefined)[];
  class?: string;
  showMenu: Accessor<{x: number; y: number} | false>;
  closeMenu(): void;
  vibrant?: boolean;
}> = (props) => {
  const [ ref, setRef ] = createSignal<Element | undefined>();

  return (
    <>
      {/*{selected() !== undefined && (
                <UKMenu
                    vibrant={props.vibrant}
                    showMenu={{ x: ref()!.clientLeft, y: ref()!.clientTop }}
                    items={(props.items[selected() as number] as { children: MenuItem[] }).children || []}
                />
            )}*/}
      <div style={{position: "fixed", "pointer-events": "none", visibility: "hidden", display: "none"}} ref={setRef}></div>
      {props.showMenu() !== false && (
        <Portal mount={ref()?.closest('[data-uikit-root="true"]') || document.body}>
          {/** biome-ignore lint/a11y/useKeyWithClickEvents: TODO: create an explanation for this */}
          {/** biome-ignore lint/a11y/noStaticElementInteractions: TODO: create an explanation for this */}
          <div
            class={styles.background}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              props.closeMenu();
              const element = document.elementFromPoint(e.clientX, e.clientY);
              if (!element) return;
              if ("click" in element) if (typeof element.click === "function") element.click();
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              props.closeMenu();
              // let element = document.elementFromPoint(e.clientX, e.clientY);
              // if (!element) return;
              //
              // element.dispatchEvent(
              //     new Event("contextmenu", { bubbles: true, cancelable: true }),
              // );
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            onMouseUp={(e) => {
              e.stopPropagation();
            }}
            onMouseMove={(e) => {
              e.stopPropagation();
            }}
          ></div>
          {/** biome-ignore lint/a11y/useKeyWithClickEvents: TODO: create an explanation for this */}
          {/** biome-ignore lint/a11y/noStaticElementInteractions: TODO: create an explanation for this */}
          <div
            data-vibrant={props.vibrant}
            onContextMenu={(e) => e.preventDefault()}
            onClick={() => props.closeMenu()}
            class={clsx(styles.root, props.class)}
            style={{
              top: `${(props.showMenu() as {y: number}).y}px`,
              left: `${(props.showMenu() as {x: number}).x}px`,
            }}
          >
            <For each={props.items}>
              {(item) => {
                if (item === undefined) return null;

                return (
                  <>
                    {item.type === "divider" && <UKDivider class={styles.divider} direction={"horizontal"} />}
                    {item.type === "spacer" && <div class={styles.spacer} />}
                    {item.type === "button" && (
                      <button
                        type="button"
                        disabled={item.disabled}
                        class={clsx(styles.button, item.selected && styles.selected)}
                        onClick={() => {
                          item.onClick();
                        }}
                      >
                        {item.leadingIcon && <UKIcon class={styles.icon}>{item.leadingIcon}</UKIcon>}
                        <div class={styles.text}>
                          <UKText class={styles.label} role={"label"} size={"m"}>
                            {item.label}
                          </UKText>
                          <UKText class={styles.supportingText} role={"label"} size={"s"}>
                            {item.supportingText}
                          </UKText>
                        </div>
                      </button>
                    )}
                    {item.type === "category" && (
                      <button
                        type="button"
                        disabled={item.disabled}
                        class={clsx(styles.button, item.selected && styles.selected)}
                        // onMouseEnter={() => {
                        //     setSelected(index());
                        // }}
                        // onMouseLeave={() => {
                        //     setSelected(undefined);
                        // }}
                        onClick={() => {
                          item.onClick?.();
                        }}
                      >
                        {item.leadingIcon && <UKIcon class={styles.icon}>{item.leadingIcon}</UKIcon>}
                        <div class={styles.text}>
                          <UKText class={styles.label} role={"label"} size={"m"}>
                            {item.label}
                          </UKText>
                          <UKText class={styles.supportingText} role={"label"} size={"s"}>
                            {item.supportingText}
                          </UKText>
                        </div>
                        <UKIcon class={styles.icon}>arrow_right</UKIcon>
                      </button>
                    )}
                  </>
                );
              }}
            </For>
          </div>
        </Portal>
      )}
    </>
  );
};

export default UKMenu;
