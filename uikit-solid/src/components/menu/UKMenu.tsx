import { type Component, createEffect, createSignal, For, type ParentProps } from "solid-js";
import UKDivider from "../divider/UKDivider.tsx";
import clsx from "clsx";
import styles from "./UKMenu.module.scss";
import { Portal } from "solid-js/web";
import { Ref } from "@solid-primitives/refs";
import UKText from "../text/UKText.tsx";
import UKIcon from "../icon/UKIcon.tsx";

type MenuItem =
    | {
          type: "button";
          leadingIcon?: string;
          label?: string;
          supportingText?: string;
          badge?: string;
          onClick(): void;
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

const UKMenu: Component<
    ParentProps<{
        items: (MenuItem | undefined)[];
        class?: string;
        showMenu?: { x: number; y: number } | false;
        vibrant?: boolean;
    }>
> = (props) => {
    const [ref, setRef] = createSignal<Element | undefined>();
    const [showMenu, setShowMenu] = createSignal<{ x: number; y: number } | false>(props.showMenu || false);
    const [selected, setSelected] = createSignal<number | undefined>(undefined);

    createEffect(() => {
        const element = ref();

        if (!element) return;

        element.addEventListener("contextmenu", (e) => {
            e.preventDefault();

            if (e.target === element)
                setShowMenu({
                    x: (e as unknown as MouseEvent).clientX,
                    y: (e as unknown as MouseEvent).clientY,
                });
        });
    });

    return (
        <>
            <Ref ref={setRef}>{props.children || <div />}</Ref>
            {selected() !== undefined && (
                <UKMenu
                    vibrant={props.vibrant}
                    showMenu={{ x: ref()!.clientLeft, y: ref()!.clientTop }}
                    items={(props.items[selected() as number] as { children: MenuItem[] }).children || []}
                />
            )}
            {showMenu() !== false && (
                <Portal mount={ref()?.closest("[data-uikit-root]") || document.body}>
                    <div
                        class={styles.background}
                        onClick={(e) => {
                            e.preventDefault();
                            setShowMenu(false);
                            let element = document.elementFromPoint(e.clientX, e.clientY);
                            if (!element) return;
                            if ("click" in element) if (typeof element.click === "function") element.click();
                        }}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            setShowMenu(false);
                            // let element = document.elementFromPoint(e.clientX, e.clientY);
                            // if (!element) return;
                            //
                            // element.dispatchEvent(
                            //     new Event("contextmenu", { bubbles: true, cancelable: true }),
                            // );
                        }}
                    ></div>
                    <div
                        data-vibrant={props.vibrant}
                        onContextMenu={(e) => e.preventDefault()}
                        onClick={() => setShowMenu(false)}
                        class={clsx(styles.root, props.class)}
                        style={{
                            top: (showMenu() as { y: number }).y + "px",
                            left: (showMenu() as { x: number }).x + "px",
                        }}
                    >
                        <For each={props.items}>
                            {(item, index) => {
                                if (item === undefined) return null;

                                return (
                                    <>
                                        {item.type === "divider" && (
                                            <UKDivider class={styles.divider} direction={"horizontal"} />
                                        )}
                                        {item.type === "spacer" && <div class={styles.spacer} />}
                                        {item.type === "button" && (
                                            <button
                                                disabled={item.disabled}
                                                class={clsx(styles.button, item.selected && styles.selected)}
                                                onClick={() => {
                                                    item.onClick();
                                                }}
                                            >
                                                {item.leadingIcon && (
                                                    <UKIcon class={styles.icon}>{item.leadingIcon}</UKIcon>
                                                )}
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
                                                {item.leadingIcon && (
                                                    <UKIcon class={styles.icon}>{item.leadingIcon}</UKIcon>
                                                )}
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
