import { Index, type Component, type ParentProps } from "solid-js";
import styles from "./UKSideBar.module.scss";
import UKIcon from "../icon/UKIcon.tsx";
import useIsMobile from "../../core/useIsMobile.ts";
import UKDivider from "../divider/UKDivider.tsx";

interface ButtonItem {
  type: "button";
  icon: { type: "icon" | "image"; value: string };
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

const UKSideBar: Component<
  ParentProps<{
    items: (ButtonItem | LabelItem | DividerItem | MarginItem | undefined)[];
  }>
> = (props) => {
  const isMobile = useIsMobile();

  return (
    <div class={styles.root} data-sidebar-mode-mobile-mode={isMobile()}>
      <div class={styles.component}>
        <Index each={props.items.filter((i) => i !== undefined)}>
          {(item) => {
            switch (item().type) {
              case "button":
                return (
                  <button
                    class={styles.button}
                    data-selected={(item() as ButtonItem).active}
                    onClick={(item() as ButtonItem).onClick}
                  >
                    {(item() as ButtonItem).icon && (
                      <>
                        {(item() as ButtonItem).icon.type === "image" ? (
                          <img
                            src={(item() as ButtonItem).icon.value}
                            alt={""}
                          />
                        ) : (
                          <UKIcon class={styles.buttonIcon}>
                            {(item() as ButtonItem).icon.value}
                          </UKIcon>
                        )}
                      </>
                    )}
                    <div class={styles.buttonLabel}>
                      {(item() as ButtonItem).label}
                    </div>
                    {(item() as ButtonItem).badgeLabel && (
                      <div class={styles.badgeLabel}>
                        {(item() as ButtonItem).badgeLabel}
                      </div>
                    )}
                  </button>
                );
              case "label":
                return (
                  <div class={styles.label}>{(item() as LabelItem).label}</div>
                );
              case "margin":
                return <div class={styles.margin} />;
              case "divider":
                return (
                  <UKDivider
                    class={styles.divider}
                    width="middle-inset"
                    direction="horizontal"
                  />
                );
              default:
                return <div>AHH</div>;
            }
          }}
        </Index>
      </div>
      <div class={styles.page}>{props.children}</div>
    </div>
  );
};

export default UKSideBar;
