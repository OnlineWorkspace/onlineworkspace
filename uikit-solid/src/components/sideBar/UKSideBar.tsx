import MENU_ICON from "@material-symbols/svg-700/outlined/menu.svg";
import MENU_OPEN_ICON from "@material-symbols/svg-700/outlined/menu_open.svg";
import clsx from "clsx";
import {type Component, createSignal, For, type ParentProps, Show} from "solid-js";
import useIsMobile from "../../core/useIsMobile.ts";
import UKDivider from "../divider/UKDivider.tsx";
import UKIcon from "../icon/UKIcon.tsx";
import UKIconButton from "../iconButton/UKIconButton.tsx";
import styles from "./UKSideBar.module.scss";

interface ButtonItem {
  type: "button";
  icon: {type: "icon" | "image"; value: string};
  imageIcon?: string;
  label: string;
  onClick: () => void;
  onMiddleClick?: () => void;
  badgeLabel?: number;
  active?: boolean;
}

interface LabelItem {
  type: "label";
  label: string;
}

interface DividerItem {
  type: "divider";
}

interface MarginItem {
  type: "margin";
}

interface ComponentItem {
  type: "component";
  component: Component;
}

const UKSideBar: Component<
  ParentProps<{
    items: (ButtonItem | LabelItem | DividerItem | MarginItem | ComponentItem | undefined)[];
    containerClassName?: string;
    className?: string;
    darwinAdditionalTopMargin?: boolean;
  }>
> = (props) => {
  const isMobile = useIsMobile();
  const [ isMobileToggled, setIsMobileToggled ] = createSignal<boolean>(false);

  return (
    <div class={clsx(styles.root, props.containerClassName)} data-sidebar-mode-mobile-mode={isMobile()}>
      <div class={clsx(styles.component, props.className, props.darwinAdditionalTopMargin && styles.darwinTopMargin)}>
        {isMobile() && (
          <UKIconButton
            class={clsx(styles.mobileToggleButton, isMobileToggled() && styles.isMobileToggled)}
            icon={isMobileToggled() ? MENU_OPEN_ICON : MENU_ICON}
            alt="Toggle Sidebar"
            onClick={() => {
              setIsMobileToggled((mobileToggled) => !mobileToggled);
            }}
          />
        )}
        <Show when={!isMobile() || isMobileToggled()}>
          <For each={props.items.filter((i) => i !== undefined)}>
            {(item, index) => {
              switch (item.type) {
                case "button":
                  return (
                    <button type="button" class={styles.button} data-selected={(item as ButtonItem).active} onClick={(item as ButtonItem).onClick}>
                      {(item as ButtonItem).icon &&
                        ((item as ButtonItem).icon.type === "image" ? (
                          <img src={(item as ButtonItem).icon.value} alt={""} />
                        ) : (
                          <UKIcon class={styles.buttonIcon}>{(item as ButtonItem).icon.value}</UKIcon>
                        ))}
                      <div class={styles.buttonLabel}>{(item as ButtonItem).label}</div>
                      {(item as ButtonItem).badgeLabel && <div class={styles.badgeLabel}>{(item as ButtonItem).badgeLabel}</div>}
                    </button>
                  );
                case "label":
                  return <div class={clsx(styles.label, index() === 0 && styles.isLabelFirstItem)}>{(item as LabelItem).label}</div>;
                case "margin":
                  return <div class={styles.margin} />;
                case "divider":
                  return <UKDivider class={styles.divider} width="middle-inset" direction="horizontal" />;
                case "component":
                  return <>{(item as ComponentItem).component}</>;
                default:
                  return <div>AHH</div>;
              }
            }}
          </For>
        </Show>
      </div>
      <div class={styles.page}>{props.children}</div>
    </div>
  );
};

export default UKSideBar;
