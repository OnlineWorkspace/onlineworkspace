import { type Component, createResource, createSignal, For } from "solid-js";
import UKButton from "@tcsw/uikit-solid/src/components/button/UKButton.tsx";
import UKDialog from "@tcsw/uikit-solid/src/components/dialog/UKDialog.tsx";
import trpc from "../../../../../lib/trpc.ts";
import UKCard from "@tcsw/uikit-solid/src/components/card/UKCard.tsx";
import UKIcon from "@tcsw/uikit-solid/src/components/icon/UKIcon.tsx";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.tsx";

const AddShortcutButton: Component<{ refetchData: () => void; addShortcut: (shortcutId: string) => void }> = (props) => {
  const [showDialog, setShowDialog] = createSignal<boolean>(false);
  const [availableShortcuts, setAvailableShortcuts] = createResource(() =>
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
        <For each={availableShortcuts()}>
          {(shortcut) => {
            return (
              <UKCard color={"outlined"} onClick={() => {
                props.addShortcut(shortcut.id);
                setShowDialog(false);
              }}>
                {shortcut.icon.type === "icon" && (
                  <UKIcon>{shortcut.icon.value}</UKIcon>
                )}
                {shortcut.icon.type === "image" && (
                  <img src={shortcut.icon.value} alt={""} />
                )}
                <UKText role={"label"} size={"l"}>
                  {shortcut.displayName}
                </UKText>
              </UKCard>
            );
          }}
        </For>
      </UKDialog>
    </>
  );
};

export default AddShortcutButton;
