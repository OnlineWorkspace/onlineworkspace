import CHEVRON_LEFT_ICON from "@material-symbols/svg-700/outlined/chevron_left.svg";
import { DividerDirection } from "@ewsgit/uikit-solid/src/components/divider/lib/direction.ts";
import UKDivider from "@ewsgit/uikit-solid/src/components/divider/UKDivider.tsx";
import UKStack from "@ewsgit/uikit-solid/src/components/stack/UKStack.tsx";
import UKStackItem from "@ewsgit/uikit-solid/src/components/stack/UKStackItem.tsx";
import UKTopAppBar from "@ewsgit/uikit-solid/src/components/topAppBar/UKTopAppBar.tsx";
import { useNavigate } from "@solidjs/router";
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
            navigate("/app/uk.ewsgit.settings");
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
            supportingText={"Choose and customize your color theme"}
            onClick={() => {
              navigate("/app/uk.ewsgit.settings/customization/color-theme");
            }}
          />
          <UKStackItem
            labelText={"Wallpaper"}
            supportingText={"Set and adjust your wallpaper"}
            onClick={() => {
              navigate("/app/uk.ewsgit.settings/customization/wallpaper");
            }}
          />
          <UKStackItem
            labelText={"Quick Shortcuts"}
            supportingText={"Modify the applications shown in your quick shortcuts"}
            onClick={() => {
              navigate("/app/uk.ewsgit.settings/customization/quick-shortcuts");
            }}
          />
        </UKStack>
      </div>
    </>
  );
};

export default CustomizationPage;
