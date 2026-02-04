import { For, type Component, type ParentProps } from "solid-js";
import styles from "./UKSideBar.module.scss";
import UKIcon from "../icon/UKIcon.tsx";
import useIsMobile from "../../core/useIsMobile.ts";

const UKSideBar: Component<
    ParentProps<{
        items: (
            | {
                  type: "button";
                  icon: { type: "icon" | "image"; value: string };
                  imageIcon?: string;
                  label: string;
                  onClick: () => void;
                  onMiddleClick?: () => void;
                  badgeLabel?: number;
                  active?: boolean;
              }
            | {
                  type: "label";
                  label: string;
              }
            | {
                  type: "divider";
              }
            | undefined
        )[];
    }>
> = (props) => {
    const isMobile = useIsMobile();

    return (
        <div class={styles.root} data-sidebar-mode-mobile-mode={isMobile()}>
            <div class={styles.component}>
                <For each={props.items}>
                    {(item) => {
                        if (!item) return null;

                        switch (item.type) {
                            case "button":
                                return (
                                    <button class={styles.button} data-selected={item.active} onClick={item.onClick}>
                                        {item.icon && (
                                            <>
                                                {item.icon.type === "image" ? (
                                                    <img src={item.icon.value} alt={""} />
                                                ) : (
                                                    <UKIcon class={styles.buttonIcon}>{item.icon.value}</UKIcon>
                                                )}
                                            </>
                                        )}
                                        <div class={styles.buttonLabel}>{item.label}</div>
                                        {item.badgeLabel && <div class={styles.badgeLabel}>{item.badgeLabel}</div>}
                                    </button>
                                );
                            case "label":
                                return <div class={styles.label}>{item.label}</div>;
                            default:
                                return <div>AHH</div>;
                        }
                    }}
                </For>
            </div>
            <div class={styles.page}>{props.children}</div>
        </div>
    );
};

export default UKSideBar;
