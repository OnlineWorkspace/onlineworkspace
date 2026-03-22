import CHEVRON_LEFT_ICON from "@material-symbols/svg-500/outlined/chevron_left.svg";
import { useNavigate } from "@solidjs/router";
import { DividerDirection } from "@tcsw/uikit-solid/src/components/divider/lib/direction.js";
import UKDivider from "@tcsw/uikit-solid/src/components/divider/UKDivider.jsx";
import UKStack from "@tcsw/uikit-solid/src/components/stack/UKStack.tsx";
import UKStackItem from "@tcsw/uikit-solid/src/components/stack/UKStackItem.tsx";
import UKTopAppBar from "@tcsw/uikit-solid/src/components/topAppBar/UKTopAppBar.jsx";
import type { Component } from "solid-js";
import ThemePreview from "./components/ThemePreview/ThemePreview.tsx";
import styles from "./Index.module.scss";

const CustomizationPage: Component = () => {
  const navigate = useNavigate();

  return (
    <>
      <UKTopAppBar
        type="small"
        headline={"Customization"}
        leadingButton={{
          icon: CHEVRON_LEFT_ICON,
          onClick() {
            navigate("/app/uk.tcsw.settings");
          },
          accessibleLabel: "Go back",
        }}
      />
      <div class={styles.page}>
        <div class={styles.header}>
          <ThemePreview />
          <UKDivider direction={DividerDirection.horizontal} width={"middle-inset"} />
        </div>
        <UKStack>
          <UKStackItem
            labelText={"Color Theme"}
            supportingText={"To be implemented..."}
            onClick={() => {
              navigate("/app/uk.tcsw.settings/customization/color-theme");
            }}
          />
          <UKStackItem
            labelText={"Wallpaper"}
            supportingText={"Set and adjust your wallpaper"}
            onClick={() => {
              navigate("/app/uk.tcsw.settings/customization/wallpaper");
            }}
          />
          <UKStackItem
            labelText={"Quick Shortcuts"}
            supportingText={"Modify the applications shown in your quick shortcuts"}
            onClick={() => {
              navigate("/app/uk.tcsw.settings/customization/quick-shortcuts");
            }}
          />
        </UKStack>
      </div>
    </>
  );
};

export default CustomizationPage;
