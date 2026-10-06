import CHEVRON_LEFT_ICON from "@material-symbols/svg-700/outlined/chevron_left.svg";
import DOCK_TO_LEFT_ICON from "@material-symbols/svg-700/outlined/dock_to_left.svg";
import PALETTE_ICON from "@material-symbols/svg-700/outlined/palette.svg";
import WALLPAPER_ICON from "@material-symbols/svg-700/outlined/wallpaper.svg";
import UKStack from "@ewsgit/uikit-solid/src/components/stack/UKStack.tsx";
import UKStackItem from "@ewsgit/uikit-solid/src/components/stack/UKStackItem.tsx";
import UKTopAppBar from "@ewsgit/uikit-solid/src/components/topAppBar/UKTopAppBar.tsx";
import { useNavigate } from "@solidjs/router";
import type { Component } from "solid-js";
import baseSettingsPageStyles from "../../BaseSettingsPage.module.scss";
import ThemePreview from "./components/ThemePreview/ThemePreview.tsx";
import styles from "./Index.module.scss";

const BASE = "/app/uk.ewsgit.settings/customization";

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
      <div class={baseSettingsPageStyles.baseSettingsPageContent}>
        <div class={styles.page}>
          <ThemePreview />
          <UKStack>
            <UKStackItem
              leading={{ type: "icon", value: PALETTE_ICON }}
              labelText={"Color Theme"}
              supportingText={"Choose and customize your color theme"}
              onClick={() => navigate(`${BASE}/color-theme`)}
            />
            <UKStackItem
              leading={{ type: "icon", value: WALLPAPER_ICON }}
              labelText={"Wallpaper"}
              supportingText={"Set and adjust your wallpaper"}
              onClick={() => navigate(`${BASE}/wallpaper`)}
            />
            <UKStackItem
              leading={{ type: "icon", value: DOCK_TO_LEFT_ICON }}
              labelText={"Quick Shortcuts"}
              supportingText={"Modify the applications shown in your quick shortcuts"}
              onClick={() => navigate(`${BASE}/quick-shortcuts`)}
            />
          </UKStack>
        </div>
      </div>
    </>
  );
};

export default CustomizationPage;
