import {
  type Component,
  createEffect,
  createResource,
  createSignal,
  For,
  Suspense,
} from "solid-js";
import UKButton from "@tcsw/uikit-solid/src/components/button/UKButton.tsx";
import UKDialog from "@tcsw/uikit-solid/src/components/dialog/UKDialog.tsx";
import trpc from "../../../../../lib/trpc.ts";
import UKCard from "@tcsw/uikit-solid/src/components/card/UKCard.tsx";
import UKIcon from "@tcsw/uikit-solid/src/components/icon/UKIcon.tsx";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.tsx";
import styles from "./AddShortcutButton.module.scss";
import UKDivider from "@tcsw/uikit-solid/src/components/divider/UKDivider.jsx";
import UKIndeterminateSpinner from "@tcsw/uikit-solid/src/components/indeterminateSpinner/UKIndeterminateSpinner.jsx";

const AddShortcutButton: Component<{
  refetchData: () => void;
  addShortcut: (shortcutId: string) => void;
}> = (props) => {
  const [showDialog, setShowDialog] = createSignal<boolean>(false);
  const [availableShortcuts, { refetch: refetchAvailableShortcuts }] =
    createResource(() =>
      trpc.customization.quickShortcuts.availableShortcuts.query(),
    );

  createEffect(() => {
    if (showDialog()) {
      refetchAvailableShortcuts();
    }
  });

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
      <UKDialog
        dialogColor="outlined"
        onClose={() => setShowDialog(false)}
        show={showDialog}
      >
        <UKText role={"title"} size={"l"}>
          Select a shortcut to add
        </UKText>
        <UKDivider direction="horizontal" class={styles.dialogDivider} />
        <div class={styles.shortcutGrid}>
          <Suspense
            fallback={
              <div class={styles.spinner}>
                <UKIndeterminateSpinner />
              </div>
            }
          >
            {availableShortcuts()?.length === 0 ? (
              <>
                <UKText role={"body"} size={"l"}>No more Quick Shortcuts are available</UKText>
              </>
            ) : (
              <For each={availableShortcuts()}>
                {(shortcut) => {
                  return (
                    <UKCard
                      class={styles.shortcut}
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
            )}
          </Suspense>
        </div>
        <UKButton color="tonal" onClick={() => setShowDialog(false)}>
          Close
        </UKButton>
      </UKDialog>
    </>
  );
};

export default AddShortcutButton;
