import CHEVRON_LEFT_ICON from "@material-symbols/svg-700/outlined/chevron_left.svg";
import REFRESH_ICON from "@material-symbols/svg-700/outlined/refresh.svg";
import { useNavigate } from "@solidjs/router";
import UKButton from "@tcsw/uikit-solid/src/components/button/UKButton.jsx";
import UKButtonGroup from "@tcsw/uikit-solid/src/components/buttonGroup/UKButtonGroup.jsx";
import UKCard from "@tcsw/uikit-solid/src/components/card/UKCard.jsx";
import UKDivider from "@tcsw/uikit-solid/src/components/divider/UKDivider.tsx";
import UKIcon from "@tcsw/uikit-solid/src/components/icon/UKIcon.tsx";
import UKStack from "@tcsw/uikit-solid/src/components/stack/UKStack.tsx";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.tsx";
import UKTopAppBar from "@tcsw/uikit-solid/src/components/topAppBar/UKTopAppBar.jsx";
import { type Component, createResource, createSignal } from "solid-js";
import trpc from "../../../lib/trpc";
import AddShortcutButton from "./components/addShortcutButton/AddShortcutButton.tsx";
import QuickShortcuts from "./components/quickShortcuts/QuickShortcuts.tsx";
import ResetToDefaultsButton from "./components/resetToDefaultsButton/ResetToDefaultsButton.tsx";
import styles from "./Index.module.scss";

const QuickShortcutsPage: Component = () => {
  const navigate = useNavigate();
  const [data, { mutate: mutateData }] = createResource(() => trpc.customization.quickShortcuts.getSettingData.query());
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
            navigate("/app/uk.tcsw.settings/customization");
          },
        }}
      />
      <div class={styles.page}>
        {/*{data() && (*/}
        {/*  <QuickShortcuts*/}
        {/*    defaultValue={data()?.defaultValue}*/}
        {/*    currentValue={data()?.currentValue}*/}
        {/*  />*/}
        {/*)}*/}
        <UKText role={"body"} size={"l"}>
          Quick shortcuts are the application shortcuts displayed inside the navigation bar.
          <br />
          The navigation bar can be found on the left or bottom of the screen.
        </UKText>
        {hasBeenModified() ? (
          <>
            <UKDivider width={"middle-inset"} direction={"horizontal"} />
            <UKCard color="elevated" class={styles.hasBeenModifiedCard}>
              <UKText role={"title"} size={"l"}>
                Quick Shortcuts have been modified
              </UKText>
              <UKText role={"body"} size={"l"}>
                To see your quick shortcut changes in the navigation bar, you will need to reload the page.
              </UKText>
              <UKButtonGroup align="end" size="s">
                <UKButton
                  leadingIcon={REFRESH_ICON}
                  onClick={() => {
                    window.location.reload();
                  }}
                >
                  Reload
                </UKButton>
              </UKButtonGroup>
            </UKCard>
          </>
        ) : null}
        <UKDivider width={"middle-inset"} direction={"horizontal"} />
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
                await trpc.application.setApplicationStringListSettingValue.mutate({ applicationId: "core", id: "quick_shortcuts", value: shortcuts });
              }}
            />
          )}
        </UKStack>
        <div class={styles.shortcutActionButtons}>
          <ResetToDefaultsButton
            onReset={async () => {
              mutateData((previousData) => {
                return { ...previousData!, enabledShortcuts: previousData!.defaultShortcuts };
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
