import { type Component, Index, type JSX, type ParentProps } from "solid-js";
import styles from "./UKNavigationRail.module.scss";
import UKNavigationRailItem from "./item/UKNavigationRailItem";
import UKNavigationRailMenuButton from "./menuButton/UKNavigationRailMenuButton";
import clsx from "clsx";
import useIsMobile from "../../core/useIsMobile";

const UKNavigationRail: Component<
  ParentProps<{
    anchorPoints?: {
      topMost?: JSX.Element;
      top?: JSX.Element;
      bottom?: JSX.Element;
    };
    floatingActionButtons?: {
      icon: string;
      label: string;
      onClick: () => void;
    }[];
    items?: (
      | {
          icon: { type: "icon" | "image"; value: string };
          imageIcon?: string;
          label: string;
          onClick: () => void;
          onMiddleClick?: () => void;
          badgeCount?: number;
          active?: boolean;
        }
      | undefined
    )[];
    expanded?: boolean;
    setExpanded?: (expanded: boolean) => void;
    type?: "modal" | "surface";
    class?: string;
  }>
> = (props) => {
  const isMobile = useIsMobile();

  return (
    <div class={styles.layout} data-navigation-rail-mobile-mode={isMobile()}>
      <div
        style={{ order: 0 }}
        class={clsx(styles.root, props.class)}
        data-type={props.type || "modal"}
        data-expanded={props.expanded || false}
      >
        {props.anchorPoints?.topMost}
        {props.setExpanded && (
          <UKNavigationRailMenuButton
            setExpanded={props.setExpanded}
            expanded={props.expanded || false}
          />
        )}
        {props.anchorPoints?.top}
        {props.items ? (
          <Index each={props.items.filter((i) => i !== undefined)}>
            {(i) => (
              <UKNavigationRailItem
                expanded={props.expanded || false}
                {...i()}
              />
            )}
          </Index>
        ) : null}
        {props.anchorPoints?.bottom}
      </div>
      <div
        class={styles.pageRoot}
        style={{ ...(isMobile() ? { order: -1 } : { order: 1 }) }}
      >
        {props.children}
      </div>
    </div>
  );
};

export default UKNavigationRail;
