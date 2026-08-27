import CHEVRON_LEFT_ICON from "@material-symbols/svg-700/outlined/chevron_left.svg";
import UKStackLabel from "@ewsgit/uikit-solid/src/components/stack/UKStackLabel.tsx";
import UKTopAppBar from "@ewsgit/uikit-solid/src/components/topAppBar/UKTopAppBar.tsx";
import { useNavigate } from "@solidjs/router";
import type { Component } from "solid-js";
import DuplicateFiles from "./components/DuplicateFiles/DuplicateFiles";
import TemporaryFiles from "./components/TemporaryFiles/TemporaryFiles";
import UsageGraph from "./components/UsageGraph/UsageGraph";
import styles from "./Index.module.scss";

const StoragePage: Component = () => {
  const navigate = useNavigate();

  return (
    <>
      <UKTopAppBar
        type="small"
        headline={"Storage"}
        leadingButton={{
          icon: CHEVRON_LEFT_ICON,
          onClick() {
            navigate("/app/uk.ewsgit.settings");
          },
          accessibleLabel: "Go back",
        }}
      />
      <div class={styles.page}>
        <UsageGraph />
        <UKStackLabel>Duplicate Files</UKStackLabel>
        <DuplicateFiles />
        <UKStackLabel>Temporary Files</UKStackLabel>
        <TemporaryFiles />
      </div>
    </>
  );
};

export default StoragePage;
