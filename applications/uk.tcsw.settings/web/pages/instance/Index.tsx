import type { Component } from "solid-js";
import styles from "./Index.module.scss";
import Users from "./components/Users/Users";
import InstalledApplications from "./components/InstalledApplications/InstalledApplications";
import FeatureFlags from "./components/FeatureFlags/FeatureFlags";

const InstancePage: Component = () => {
    return (
        <div class={styles.root}>
            <Users />
            <InstalledApplications />
            <FeatureFlags />
        </div>
    );
};

export default InstancePage;
