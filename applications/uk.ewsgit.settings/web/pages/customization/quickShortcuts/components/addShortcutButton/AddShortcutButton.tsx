import ADD_ICON from "@material-symbols/svg-700/outlined/add.svg";
import UKButton from "@onlineworkspace/uikit-solid/src/components/button/UKButton.tsx";
import UKCard from "@onlineworkspace/uikit-solid/src/components/card/UKCard.tsx";
import UKDialog from "@onlineworkspace/uikit-solid/src/components/dialog/UKDialog.tsx";
import UKDivider from "@onlineworkspace/uikit-solid/src/components/divider/UKDivider.jsx";
import UKIcon from "@onlineworkspace/uikit-solid/src/components/icon/UKIcon.tsx";
import UKIndeterminateSpinner from "@onlineworkspace/uikit-solid/src/components/indeterminateSpinner/UKIndeterminateSpinner.jsx";
import UKText from "@onlineworkspace/uikit-solid/src/components/text/UKText.tsx";
import { type Component, createSignal, For, Suspense } from "solid-js";
import styles from "./AddShortcutButton.module.scss";

const AddShortcutButton: Component<{
  addShortcut: (shortcutId: string) => void;
  enabledShortcuts: string[];
  shortcutMetadata: Record<
    string,
    {
      id: string;
      displayName: string;
      icon: { type: "icon" | "image"; value: string };
    }
  >;
}> = (props) => {
  const [showDialog, setShowDialog] = createSignal<boolean>(false);

  return (
    <>
      <UKButton
        size={"s"}
        leadingIcon={ADD_ICON}
        onClick={() => {
          setShowDialog(true);
        }}
      >
        Add Shortcut
      </UKButton>
      <UKDialog dialogColor="outlined" onClose={() => setShowDialog(false)} show={showDialog}>
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
            {props.enabledShortcuts?.length === Object.keys(props.shortcutMetadata).length ? (
              <UKText role={"body"} size={"l"}>
                No more Application Quick Shortcuts are available
              </UKText>
            ) : (
              <For each={Object.values(props.shortcutMetadata).filter((shortcut) => !props.enabledShortcuts.includes(shortcut.id))}>
                {(shortcut) => {
                  return (
                    <UKCard
                      class={styles.shortcut}
                      onClick={() => {
                        props.addShortcut(shortcut.id);
                        setShowDialog(false);
                      }}
                    >
                      {shortcut.icon.type === "icon" && <UKIcon class={styles.shortcutIcon}>{shortcut.icon.value}</UKIcon>}
                      {shortcut.icon.type === "image" && <img class={styles.shortcutImage} src={shortcut.icon.value} alt={""} />}
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
