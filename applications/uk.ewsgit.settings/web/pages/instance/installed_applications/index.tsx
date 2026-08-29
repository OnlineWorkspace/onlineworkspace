import type { Component } from "solid-js";
import UKTopAppBar from "@ewsgit/uikit-solid/src/components/topAppBar/UKTopAppBar.tsx";
import CHEVRON_LEFT_ICON from "@material-symbols/svg-700/outlined/chevron_left.svg";
import { useNavigate } from "@solidjs/router";
import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import baseSettingsPageStyles from "../../../BaseSettingsPage.module.scss";
import ManageInstalledPage from "../../../../../uk.ewsgit.store/web/pages/manage-installed/Index";

const ManageInstanceInstalledApplicationsPage: Component = () => {
  const navigate = useNavigate();

  return (
    <>
      <UKTopAppBar
        type="small"
        headline={"Manage Instance Installed Applications"}
        leadingButton={{
          icon: CHEVRON_LEFT_ICON,
          onClick() {
            navigate("/app/uk.ewsgit.settings");
          },
          accessibleLabel: "Go back",
        }}
      />
{/*      <div class={baseSettingsPageStyles.baseSettingsPageContent}>
        <UKButton
          color={"filled"}
          onClick={() => navigate("/app/uk.ewsgit.store/manage-installed")}
        >
          View installed applications in the Store
        </UKButton>
      </div>*/}
      <ManageInstalledPage/>
    </>
  );
};

export default ManageInstanceInstalledApplicationsPage;
