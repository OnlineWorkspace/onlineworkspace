import { type Accessor, type Component, type ParentProps, useContext } from "solid-js";
import { Portal } from "solid-js/web";
import useIsMobile from "../../core/useIsMobile.ts";
import { RootContext } from "../../rootContext.ts";
import type { CardColor } from "../card/lib/color.ts";
import UKCard from "../card/UKCard.tsx";
import styles from "./UKDialog.module.scss";

const UKDialog: Component<
  ParentProps<{
    onClose: () => void;
    show: Accessor<boolean>;
    maxWidth?: string;
    adaptToMobile?: boolean;
    dialogColor?: CardColor;
  }>
> = (props) => {
  const rootContext = useContext(RootContext);
  const isMobile = useIsMobile();

  return (
    <>
      {props.show() && (
        <Portal mount={rootContext!.root.closest("[data-uikit-root]") || document.body}>
          {/** biome-ignore lint/a11y/noStaticElementInteractions: clickable background */}
          <div
            class={styles.component}
            data-mobile={isMobile() && props.adaptToMobile}
            style={{ "--dialog-max-width": props.maxWidth }}
            onMouseDown={(e) => {
              e.stopPropagation();

              if (e.target === e.currentTarget) {
                props.onClose();
              }
            }}
          >
            <UKCard color={props.dialogColor ?? "filled"} class={styles.card}>
              {props.children}
            </UKCard>
          </div>
        </Portal>
      )}
    </>
  );
};

export default UKDialog;
