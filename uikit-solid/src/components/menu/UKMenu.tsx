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
      }
    | {
          type: "category";
          leadingIcon?: string;
          supportingText?: string;
          label?: string;
          badge?: string;
          children?: MenuItem[];
      }
    | {
          type: "divider";
      }
    | {
          type: "spacer";
      };

const UKMenu: Component<
    ParentProps<{
        items: MenuItem[];
        class?: string;
        showMenu?: { x: number; y: number } | false;
        vibrant?: boolean;
    }>
> = (props) => {
    const [ref, setRef] = createSignal<Element | undefined>();
    const [showMenu, setShowMenu] = createSignal<{ x: number; y: number } | false>(
        props.showMenu || false,
    );
    const [selected, setSelected] = createSignal<number | undefined>(undefined);

    createEffect(() => {
        const element = ref();

        if (!element) return;

        element.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            // e.stopPropagation();

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
                    items={
                        (props.items[selected() as number] as { children: MenuItem[] }).children ||
                        []
                    }
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
                            if ("click" in element)
                                if (typeof element.click === "function") element.click();
                        }}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            setShowMenu(false);
                            let element = document.elementFromPoint(e.clientX, e.clientY);
                            if (!element) return;
                            if ("click" in element)
                                if (typeof element.click === "function") element.click();
                        }}
                    ></div>
                    <div
                        data-vibrant={props.vibrant}
                        onContextMenu={(e) => e.preventDefault()}
                        class={clsx(styles.root, props.class)}
                        style={{
                            top: (showMenu() as { y: number }).y + "px",
                            left: (showMenu() as { x: number }).x + "px",
                        }}
                    >
                        <For each={props.items}>
                            {(item, index) => {
                                return (
                                    <>
                                        {item.type === "divider" && (
                                            <UKDivider
                                                class={styles.divider}
                                                direction={"horizontal"}
                                            />
                                        )}
                                        {item.type === "spacer" && <div class={styles.spacer} />}
                                        {item.type === "button" && (
                                            <button class={styles.button}>
                                                {item.leadingIcon && (
                                                    <UKIcon class={styles.icon}>
                                                        {item.leadingIcon}
                                                    </UKIcon>
                                                )}
                                                <UKText role={"label"} size={"m"}>
                                                    {item.label}
                                                </UKText>
                                            </button>
                                        )}
                                        {item.type === "category" && (
                                            <button
                                                class={styles.button}
                                                // onMouseEnter={() => {
                                                //     setSelected(index());
                                                // }}
                                                // onMouseLeave={() => {
                                                //     setSelected(undefined);
                                                // }}
                                            >
                                                {item.leadingIcon && (
                                                    <UKIcon class={styles.icon}>
                                                        {item.leadingIcon}
                                                    </UKIcon>
                                                )}
                                                <UKText role={"label"} size={"m"}>
                                                    {item.label}
                                                </UKText>
                                                <UKIcon>arrow_right</UKIcon>
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
