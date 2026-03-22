import CHEVRON_LEFT_ICON from "@material-symbols/svg-500/outlined/chevron_left.svg";
import { useNavigate } from "@solidjs/router";
import UKTopAppBar from "@tcsw/uikit-solid/src/components/topAppBar/UKTopAppBar.jsx";
import type { Component } from "solid-js";
import Branding from "./components/Branding/Branding";
import FeatureFlags from "./components/FeatureFlags/FeatureFlags";
import InstalledApplications from "./components/InstalledApplications/InstalledApplications";
import Mailserver from "./components/Mailserver/Mailserver";
import Users from "./components/Users/Users";
import styles from "./Index.module.scss";

const InstancePage: Component = () => {
  const navigate = useNavigate();

  return (
    <>
      <UKTopAppBar
        type="small"
        headline={"Configure Instance"}
        subtitle={"Caution: Advanced users only, change at your own risk."}
        leadingButton={{
          icon: CHEVRON_LEFT_ICON,
          onClick() {
            navigate("/app/uk.tcsw.settings");
          },
          accessibleLabel: "Go back",
        }}
      />
      <div class={styles.root}>
        <Users />
        <InstalledApplications />
        <Mailserver />
        <FeatureFlags />
        <Branding />
      </div>
    </>
  );
};

export default InstancePage;
