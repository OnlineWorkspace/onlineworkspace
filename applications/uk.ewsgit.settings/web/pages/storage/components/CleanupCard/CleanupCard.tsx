import CHECK_CIRCLE_ICON from "@material-symbols/svg-700/outlined/check_circle.svg";
import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.tsx";
import UKIcon from "@ewsgit/uikit-solid/src/components/icon/UKIcon.tsx";
import UKStack from "@ewsgit/uikit-solid/src/components/stack/UKStack.tsx";
import UKStackItem from "@ewsgit/uikit-solid/src/components/stack/UKStackItem.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import { type Component, For, Show } from "solid-js";
import styles from "./CleanupCard.module.scss";

/** a group of files that could be removed, or a note that there is nothing to clean up */
const CleanupCard: Component<{ title: string; icon: string; emptyMessage: string; items: { label: string; detail?: string }[] }> = (props) => (
  <UKCard class={styles.root}>
    <div class={styles.header}>
      <UKIcon class={styles.icon}>{props.icon}</UKIcon>
      <UKText role="title" size="m" emphasized align="start" class={styles.title}>
        {props.title}
      </UKText>
    </div>
    <Show
      when={props.items.length > 0}
      fallback={
        <div class={styles.empty}>
          <UKIcon>{CHECK_CIRCLE_ICON}</UKIcon>
          <UKText role="body" size="m" align="start">
            {props.emptyMessage}
          </UKText>
        </div>
      }
    >
      <UKStack>
        <For each={props.items}>{(item) => <UKStackItem labelText={item.label} supportingText={item.detail} />}</For>
      </UKStack>
    </Show>
  </UKCard>
);

export default CleanupCard;
