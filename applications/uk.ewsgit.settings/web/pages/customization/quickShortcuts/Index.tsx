import CHEVRON_LEFT_ICON from "@material-symbols/svg-700/outlined/chevron_left.svg";
import REFRESH_ICON from "@material-symbols/svg-700/outlined/refresh.svg";
import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKButtonGroup from "@ewsgit/uikit-solid/src/components/buttonGroup/UKButtonGroup.tsx";
import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.tsx";
import UKDivider from "@ewsgit/uikit-solid/src/components/divider/UKDivider.tsx";
import UKIcon from "@ewsgit/uikit-solid/src/components/icon/UKIcon.tsx";
import UKStack from "@ewsgit/uikit-solid/src/components/stack/UKStack.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import UKTopAppBar from "@ewsgit/uikit-solid/src/components/topAppBar/UKTopAppBar.tsx";
import {useNavigate} from "@solidjs/router";
import {type Component, createResource, createSignal} from "solid-js";
import trpc from "../../../lib/trpc";
import AddShortcutButton from "./components/addShortcutButton/AddShortcutButton.tsx";
import QuickShortcuts from "./components/quickShortcuts/QuickShortcuts.tsx";
import ResetToDefaultsButton from "./components/resetToDefaultsButton/ResetToDefaultsButton.tsx";
import styles from "./Index.module.scss";
import NoticeMessage from "../../../components/noticeMessage/NoticeMessage.js";

const QuickShortcutsPage: Component = () => {
  const navigate = useNavigate();
  const [data, {mutate: mutateData}] = createResource(() => trpc.customization.quickShortcuts.getSettingData.query());
  const [hasBeenModified, setHasBeenModified] = createSignal<boolean>(false);

  return (
    <>
      <UKTopAppBar
        type={"small"}
        headline={"Quick Shortcuts"}
        leadingButton={{
          accessibleLabel: "Back",
          icon: CHEVRON_LEFT_ICON,
          onClick() {
            navigate("/app/uk.ewsgit.settings/customization");
          },
        }}
      />
      <div class={styles.page}>
        <UKText role={"body"} size={"l"}>
          Quick shortcuts are the application shortcuts displayed inside the navigation bar.
          <br/>
          The navigation bar can be found on the left or bottom of the screen.
        </UKText>
        {hasBeenModified() && <>
          <UKDivider width={"middle-inset"} direction={"horizontal"}/>
          <NoticeMessage
            title={"Quick Shortcuts have been modified"}
            body={"To see your quick shortcut changes in the navigation bar, you will need to reload the page."}
            actions={[
              {
                label: "Reload",
                icon: REFRESH_ICON,
                cb() {
                  window.location.reload();
                }
              }
            ]}
          />
        </>}
        <UKDivider width={"middle-inset"} direction={"horizontal"}/>
        <UKStack>
          {(data()?.enabledShortcuts ?? []).length === 0 ? (
            <div class={styles.noQuickShortcutsContainer}>
              <UKIcon class={styles.noQuickShortcutsIcon}>broken_image</UKIcon>
              <UKText role={"title"} size={"l"} align={"center"}>
                You have no Quick Shortcuts
              </UKText>
              <UKText role={"body"} size={"m"} align={"center"}>
                Press the "Add Shortcut" button to add your first shortcut.
              </UKText>
            </div>
          ) : (
            <QuickShortcuts
              currentValue={data()?.enabledShortcuts}
              defaultValue={data()?.defaultShortcuts ?? []}
              setShortcuts={async (shortcuts) => {
                mutateData((previousData) => {
                  return {
                    ...previousData!,
                    enabledShortcuts: shortcuts,
                  };
                });
                setHasBeenModified(true);
                await trpc.application.setApplicationStringListSettingValue.mutate({applicationId: "core", id: "quick_shortcuts", value: shortcuts});
              }}
            />
          )}
        </UKStack>
        <div class={styles.shortcutActionButtons}>
          <ResetToDefaultsButton
            onReset={async () => {
              mutateData((previousData) => {
                return {...previousData!, enabledShortcuts: previousData!.defaultShortcuts};
              });
              setHasBeenModified(true);
              await trpc.application.setApplicationStringListSettingValue.mutate({
                applicationId: "core",
                id: "quick_shortcuts",
                value: data()!.defaultShortcuts,
              });
            }}
          />
          <AddShortcutButton
            enabledShortcuts={data()?.enabledShortcuts || []}
            shortcutMetadata={data()?.shortcutMetadata || {}}
            addShortcut={async (shortcutId) => {
              mutateData((previousData) => {
                return {
                  ...previousData!,
                  enabledShortcuts: [...previousData!.enabledShortcuts!, shortcutId],
                };
              });
              setHasBeenModified(true);
              await trpc.application.setApplicationStringListSettingValue.mutate({
                applicationId: "core",
                id: "quick_shortcuts",
                value: [...data()!.enabledShortcuts!, shortcutId],
              });
            }}
          />
        </div>
      </div>
    </>
  );
};

export default QuickShortcutsPage;
