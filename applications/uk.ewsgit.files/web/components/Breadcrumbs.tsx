import CHEVRON_RIGHT_ICON from "@material-symbols/svg-700/outlined/chevron_right.svg";
import UKIcon from "@ewsgit/uikit-solid/src/components/icon/UKIcon.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import clsx from "clsx";
import { type Component, For, Show } from "solid-js";
import styles from "./Breadcrumbs.module.scss";

const Breadcrumbs: Component<{
  crumbs: { name: string; path: string }[];
  onNavigate: (path: string) => void;
  class?: string;
}> = (props) => {
  return (
    <nav class={clsx(styles.root, props.class)} aria-label="Breadcrumb">
      <For each={props.crumbs}>
        {(crumb, index) => {
          const last = () => index() === props.crumbs.length - 1;

          return (
            <>
              <Show when={index() > 0}>
                <UKIcon class={styles.separator}>{CHEVRON_RIGHT_ICON}</UKIcon>
              </Show>
              <button type="button" class={styles.crumb} data-current={last()} aria-current={last() ? "page" : undefined} onClick={() => props.onNavigate(crumb.path)}>
                <UKText role={last() ? "title" : "body"} size={last() ? "m" : "l"} emphasized={last()}>
                  {crumb.name}
                </UKText>
              </button>
            </>
          );
        }}
      </For>
    </nav>
  );
};

export default Breadcrumbs;
