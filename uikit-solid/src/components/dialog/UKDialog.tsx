import {
  type Accessor,
  type Component,
  type ParentProps,
  useContext,
} from "solid-js";
import { Portal } from "solid-js/web";
import { RootContext } from "../../rootContext.ts";
import UKCard from "../card/UKCard.tsx";
import styles from "./UKDialog.module.scss";
import useIsMobile from "../../core/useIsMobile.ts";
import type { CardColor } from "../card/lib/color.ts";

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
        <Portal
          mount={
            rootContext!.root.closest("[data-uikit-root]") || document.body
          }
        >
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
