import type { Component } from "solid-js";
import styles from "./Index.module.scss";
import Users from "./components/Users/Users";
import InstalledApplications from "./components/InstalledApplications/InstalledApplications";
import FeatureFlags from "./components/FeatureFlags/FeatureFlags";
import UKTopAppBar from "@tcsw/uikit-solid/src/components/topAppBar/UKTopAppBar.jsx";
import { useNavigate } from "@solidjs/router";
import Mailserver from "./components/Mailserver/Mailserver";

const InstancePage: Component = () => {
  const navigate = useNavigate();

  return (
    <>
      <UKTopAppBar
        type="small"
        headline={"Configure Instance"}
        subtitle={"Caution: Advanced users only, change at your own risk."}
        leadingButton={{
          icon: "chevron_left",
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
      </div>
    </>
  );
};

export default InstancePage;
