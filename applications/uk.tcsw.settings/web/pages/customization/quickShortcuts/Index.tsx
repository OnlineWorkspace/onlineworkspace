import CHEVRON_LEFT_ICON from "@material-symbols/svg-700/outlined/chevron_left.svg";
import { useNavigate } from "@solidjs/router";
import UKDivider from "@tcsw/uikit-solid/src/components/divider/UKDivider.tsx";
import UKIcon from "@tcsw/uikit-solid/src/components/icon/UKIcon.tsx";
import UKStack from "@tcsw/uikit-solid/src/components/stack/UKStack.tsx";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.tsx";
import UKTopAppBar from "@tcsw/uikit-solid/src/components/topAppBar/UKTopAppBar.jsx";
import { type Component, createResource, useContext } from "solid-js";
import trpc from "../../../lib/trpc";
import AddShortcutButton from "./components/addShortcutButton/AddShortcutButton.tsx";
import QuickShortcuts from "./components/quickShortcuts/QuickShortcuts.tsx";
import ResetToDefaultsButton from "./components/resetToDefaultsButton/ResetToDefaultsButton.tsx";
import styles from "./Index.module.scss";

const QuickShortcutsPage: Component = () => {
  const navigate = useNavigate();
  const [data, { refetch: refetchData }] = createResource(() =>
    trpc.customization.quickShortcuts.get.query(),
  );

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
        <UKDivider width={"middle-inset"} direction={"horizontal"} />
        <UKStack>
          {data()?.currentValue.length === 0 ? (
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
              currentValue={data()?.currentValue}
              defaultValue={data()?.defaultValue ?? []}
              setShortcuts={async (shortcuts) => {
                await trpc.application.setApplicationStringListSettingValue.mutate({
                  applicationId: "core",
                  id: "quick_shortcuts",
                  value: shortcuts,
                });

                refetchData();
              }}
            />
          )}
        </UKStack>
        <div class={styles.shortcutActionButtons}>
          <ResetToDefaultsButton
            refetchData={() => {
              refetchData();
            }}
          />
          <AddShortcutButton
            refetchData={() => {
              refetchData();
            }}
            addShortcut={async (shortcutId) => {
              await trpc.application.setApplicationStringListSettingValue.mutate({
                applicationId: "core",
                id: "quick_shortcuts",
                value: [...(data()?.currentValue ?? []), shortcutId],
              });
              refetchData();
            }}
          />
        </div>
      </div>
    </>
  );
};

export default QuickShortcutsPage;
