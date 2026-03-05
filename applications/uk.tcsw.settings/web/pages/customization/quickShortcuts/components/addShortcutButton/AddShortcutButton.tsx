import { type Component, createResource, createSignal, For } from "solid-js";
import UKButton from "@tcsw/uikit-solid/src/components/button/UKButton.tsx";
import UKDialog from "@tcsw/uikit-solid/src/components/dialog/UKDialog.tsx";
import trpc from "../../../../../lib/trpc.ts";
import UKCard from "@tcsw/uikit-solid/src/components/card/UKCard.tsx";
import UKIcon from "@tcsw/uikit-solid/src/components/icon/UKIcon.tsx";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.tsx";
import styles from "./AddShortcutButton.module.scss";

const AddShortcutButton: Component<{
  refetchData: () => void;
  addShortcut: (shortcutId: string) => void;
}> = (props) => {
  const [showDialog, setShowDialog] = createSignal<boolean>(false);
  const [availableShortcuts] = createResource(() =>
    trpc.customization.quickShortcuts.availableShortcuts.query(),
  );

  return (
    <>
      <UKButton
        size={"s"}
        leadingIcon={"add"}
        onClick={() => {
          setShowDialog(true);
        }}
      >
        Add Shortcut
      </UKButton>
      <UKDialog onClose={() => setShowDialog(false)} show={showDialog}>
        <UKText role={"title"} size={"l"}>Add a shortcut</UKText>
        <div class={styles.shortcutGrid}>
          <For each={availableShortcuts()}>
            {(shortcut) => {
              return (
                <UKCard
                  class={styles.shortcut}
                  color={"outlined"}
                  onClick={() => {
                    props.addShortcut(shortcut.id);
                    setShowDialog(false);
                  }}
                >
                  {shortcut.icon.type === "icon" && (
                    <UKIcon class={styles.shortcutIcon}>
                      {shortcut.icon.value}
                    </UKIcon>
                  )}
                  {shortcut.icon.type === "image" && (
                    <img
                      class={styles.shortcutImage}
                      src={shortcut.icon.value}
                      alt={""}
                    />
                  )}
                  <UKText align={"center"} role={"label"} size={"l"}>
                    {shortcut.displayName}
                  </UKText>
                </UKCard>
              );
            }}
          </For>
        </div>
      </UKDialog>
    </>
  );
};

export default AddShortcutButton;
